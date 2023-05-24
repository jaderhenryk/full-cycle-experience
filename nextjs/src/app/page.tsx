'use client'

import { FormEvent, useEffect, useLayoutEffect, useState } from 'react';
import ClientHttp, { fetcher } from '@/http/http';
import { Chat, Message } from '@prisma/client';
import { useRouter, useSearchParams } from 'next/navigation';

import useSWR from 'swr';
import useSwRSubscription from 'swr/subscription';

import { PlusIcon } from './components/PlusIcon';
import { MessageIcon } from './components/MessageIcon';
import { ArrowRightIcon } from './components/ArrowRightIcon';
import ChatItem from './components/ChatItem';
import ChatItemError from './components/ChatItemError';
import { LogoutIcon } from './components/LogoutIcon';
import { signOut } from 'next-auth/react';

type ChatWithFirstMessage = Chat & {
  messages: [Message]
}

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatIdParam = searchParams.get('id');
  const [chatId, setChatId] = useState<string | null>(chatIdParam);
  const [messageId, setMessageId] = useState<string | null>(null);

  const { data: chats, mutate: mutateChats } = useSWR<ChatWithFirstMessage[]>('chats', fetcher, {
    fallbackData: [],
    revalidateOnFocus: false,
  });
  const { data: messages, mutate: mutateMessages } = useSWR<Message[]>(
    chatId ? `chats/${chatId}/messages`: null,
    fetcher, {
    fallbackData: [],
    revalidateOnFocus: false,
  });
  const { data: messageLoading, error: errorMessageLoading } = useSwRSubscription(
    messageId ? `/api/messages/${messageId}/events` : null,
    (path: string, {next}) => {
    const eventSource =  new EventSource(path);
    eventSource.onmessage = (event) => {
      console.log('data:', event);
      const newMessage = JSON.parse(event.data);
      next(null, newMessage.content);
    }
    eventSource.onerror = (event) => {
      console.log('error:', event);
      eventSource.close();
      //@ts-ignore
      next(event.data, null);
    }
    eventSource.addEventListener('end', (event) => {
      console.log('end', event)
      eventSource.close();
      const newMessage = JSON.parse(event.data);
      mutateMessages((messages) => [...messages!, newMessage], false);
      next(null, null);
    });
    return () => {
      console.log('close event source');
      eventSource.close();
    }
  });

  useEffect(() => {
    setChatId(chatIdParam);
  }, [chatIdParam]);

  useEffect(() => {
    const textarea = document.querySelector('#message') as HTMLTextAreaElement;
    textarea.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
      }
    });
    textarea.addEventListener('keyup', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        const form = document.querySelector('#form') as HTMLFormElement;
        const buttonSubmit = form.querySelector('button') as HTMLButtonElement;
        form.requestSubmit(buttonSubmit);
        return;
      }
      if (textarea.scrollHeight >= 200) {
        textarea.style.overflowY = 'scroll';
      } else {
        textarea.style.overflowY = 'hidden';
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
      }
    });
  }, []);

  useLayoutEffect(() => {
    if (!messageLoading) {
      return;
    }
    const chatting = document.querySelector("#chatting") as HTMLUListElement;
    chatting.scrollTop = chatting.scrollHeight;
  }, [messageLoading]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const textarea = event.currentTarget.querySelector('textarea') as HTMLTextAreaElement;
    const message = textarea.value;
    if (!chatId) { // Create a new Chat
      const newChat: ChatWithFirstMessage = await ClientHttp.post('chats', { message });
      mutateChats([newChat, ...chats!], false); // re-render the component but don't do another request
      setChatId(newChat.id);
      setMessageId(newChat.messages[0].id);
    } else { // or Create a new message if chat is already created 
      const newMessage: Message = await ClientHttp.post(`chats/${chatId}/messages`, { message });
      mutateMessages([...messages!, newMessage], false);
      setMessageId(newMessage.id);
    }
    textarea.value = '';
  }

  async function logout() {
    await signOut({ redirect: false });
    const { url } = await ClientHttp.get(`logout-url?${new URLSearchParams({ redirect: window.location.origin })}`);
    window.location.href = url;
  }

  return (
    <div className="overflow-hidden w-full h-full relative flex">
      <div className="bg-gray-900 w-[300px] h-screen p-2 flex flex-col">
        <button 
          className="flex items-center justify-center text-white gap-3 mb-1 p-3 border border-white/20 rounded hover:bg-gray-500/10"
          type="button"
          onClick={() => router.push('/')}
        >
          <PlusIcon className="w-5 h-5"/>
          New Chat
        </button>
        <div className="flex-grow overflow-y-auto mr-2 overflow-hidden">
          {
            chats?.map((chat, key) => (
              <div 
                className="pb-2 text-gray-100 text-sm mr-2"
                key={key}
              >
                  <button
                    className="flex p-3 gap-3 w-full hover:bg-[#3f4579] rounded group hover:pr-4"
                    onClick={() => router.push(`/?id=${chat.id}`)}
                  >
                    <MessageIcon className="w-5 h-5"/>
                    <div className="overflow-hidden w-full text-left max-h-5 relative break-all">
                      {chat.messages[0]?.content}
                    </div>
                    <div className="absolute inset-y-0 right-0 w-8 z-10 bg-gradient-to-l from-gray-900 group-hover:from-[#3f4679]"></div>
                  </button>
              </div>
            ))
          }
        </div>
        <button 
          onClick={() => logout()}
          className="flex p-3 mt-1 gap-3 rounded hover:bg-gray-500/10 text-sm text-white"
        >
          <LogoutIcon className="w-5 h-5"/>
          Log out
        </button>
      </div>
      
      <div className="flex-1 flex-col relative">
        <ul id="chatting" className="h-screen overflow-y-auto bg-gray-800">
          {
            messages?.map((message, key) => (
              <ChatItem
                key={key}
                content={message.content}
                is_from_bot={message.is_from_bot}
              />
            ))
          }
          { 
            messageLoading &&  <ChatItem
              content={messageLoading}
              is_from_bot={true}
              loading={true}
            />
          }
          { 
            errorMessageLoading &&  <ChatItemError>{errorMessageLoading}</ChatItemError>
          }
          <li className="h-36 bg-gray-800"></li>
        </ul>
        <div className="absolute w-full bottom-0 !bg-transparent bg-gradient-to-b from-gray-800 to-gray-950">
          <div className="mb-6 mx-auto max-w-3xl">
            <form onSubmit={onSubmit} id="form">
              <div className="flex flex-col relative py-3 pl-4 text-white bg-gray-700 rounded">
                <textarea 
                  id="message"
                  tabIndex={0}
                  rows={1}
                  placeholder="Digite a sua pergunta"
                  className="resize-none bg-transparent pl-0 outline-none"
                  defaultValue="Noma do pai da rainha Elizabeth II"
                ></textarea>
                <button 
                  className="absolute top-1 text-gray-400 bottom-2.5 rounded hover:text-gray-400 hover:bg-gray-900 md:right-4"
                  type="submit"
                  disabled={messageLoading}
                >
                  <ArrowRightIcon className="text-white w-8"/>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
