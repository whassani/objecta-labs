'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { conversationsApi } from '@/lib/api'
import { ArrowLeftIcon, PaperAirplaneIcon, UserCircleIcon, SparklesIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import SourcePreviewModal from '@/components/knowledge-base/SourcePreviewModal'

export default function ConversationPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [previewSource, setPreviewSource] = useState<{
    documentId: string
    chunkId: string
    documentTitle: string
    score: number
  } | null>(null)
  const [streamingMessage, setStreamingMessage] = useState<string>('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingSources, setStreamingSources] = useState<any[]>([])
  const eventSourceRef = useRef<EventSource | null>(null)

  const handleStreamingMessage = async (content: string) => {
    setIsStreaming(true)
    setStreamingMessage('')
    setStreamingSources([])
    
    // Cancel any pending queries
    await queryClient.cancelQueries({ queryKey: ['conversation', params.id] })
    const previousConversation = queryClient.getQueryData(['conversation', params.id])
    
    try {
      await conversationsApi.streamMessage(
        params.id as string,
        content,
        (data) => {
          // Handle different event types
          if (data.type === 'user_message') {
            // Server confirmed user message - add it to display
            queryClient.setQueryData(['conversation', params.id], (old: any) => ({
              ...old,
              messages: [
                ...(old?.messages || []),
                {
                  id: data.messageId,
                  role: 'user',
                  content: data.content,
                  createdAt: new Date().toISOString(),
                },
              ],
            }))
          } else if (data.type === 'token') {
            setStreamingMessage((prev) => prev + data.content)
          } else if (data.type === 'sources') {
            setStreamingSources(data.sources)
          } else if (data.type === 'done') {
            setIsStreaming(false)
            setStreamingMessage('')
            setStreamingSources([])
            // Refresh to get the complete saved message
            queryClient.invalidateQueries({ queryKey: ['conversation', params.id] })
          } else if (data.type === 'error') {
            setIsStreaming(false)
            toast.error('Failed to generate response')
            // Rollback
            if (previousConversation) {
              queryClient.setQueryData(['conversation', params.id], previousConversation)
            }
          }
        },
        () => {
          setIsStreaming(false)
          setStreamingMessage('')
          setStreamingSources([])
        },
        (error) => {
          setIsStreaming(false)
          toast.error('Connection error')
          queryClient.setQueryData(['conversation', params.id], previousConversation)
        }
      )
    } catch (error) {
      setIsStreaming(false)
      toast.error('Failed to send message')
      queryClient.setQueryData(['conversation', params.id], previousConversation)
    }
  }

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => handleStreamingMessage(content),
    onSuccess: () => {
      setMessage('')
    },
  })

  const { data: conversation, isLoading } = useQuery({
    queryKey: ['conversation', params.id],
    queryFn: () => conversationsApi.getOne(params.id as string).then(res => res.data),
    // Only poll when not streaming
    refetchInterval: isStreaming ? false : 10000, // Poll every 10s when idle
  })

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      sendMessageMutation.mutate(message)
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation?.messages])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Link
          href="/dashboard/conversations"
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {conversation?.title || 'Conversation'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Agent: {conversation?.agentId}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4 mb-4">
        {conversation?.messages && conversation.messages.length > 0 ? (
          <>
            {conversation.messages.map((msg: any) => (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                    <SparklesIcon className="h-5 w-5 text-primary-600" />
                  </div>
                )}
                <div className="max-w-3xl space-y-2">
                  <div
                    className={`rounded-lg p-4 ${
                      msg.role === 'user'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <ReactMarkdown className="prose dark:prose-invert max-w-none">
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                  
                  {/* Sources Citation */}
                  {msg.metadata?.sources && msg.metadata.sources.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <DocumentTextIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-medium text-blue-900 dark:text-blue-200">
                          Sources Used ({msg.metadata.sources.length})
                        </span>
                      </div>
                      <div className="space-y-1">
                        {msg.metadata.sources.map((source: any, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => setPreviewSource({
                              documentId: source.documentId,
                              chunkId: source.chunkId,
                              documentTitle: source.documentTitle,
                              score: source.score,
                            })}
                            className="w-full flex items-center justify-between text-xs hover:bg-blue-100 dark:hover:bg-blue-800/30 p-1 rounded transition"
                          >
                            <span className="text-blue-700 dark:text-blue-300 truncate">
                              {source.documentTitle}
                            </span>
                            <span className="text-blue-600 dark:text-blue-400 ml-2 flex-shrink-0">
                              {(source.score * 100).toFixed(0)}% match
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <UserCircleIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                )}
              </div>
            ))}
            
            {/* Streaming message */}
            {isStreaming && streamingMessage && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                  <SparklesIcon className="h-5 w-5 text-primary-600 animate-pulse" />
                </div>
                <div className="max-w-3xl space-y-2">
                  <div className="rounded-lg p-4 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white">
                    <ReactMarkdown className="prose dark:prose-invert max-w-none">
                      {streamingMessage}
                    </ReactMarkdown>
                    <span className="inline-block w-2 h-4 ml-1 bg-primary-600 animate-pulse"></span>
                  </div>
                  
                  {/* Streaming sources */}
                  {streamingSources.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <DocumentTextIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-medium text-blue-900 dark:text-blue-200">
                          Sources Used ({streamingSources.length})
                        </span>
                      </div>
                      <div className="space-y-1">
                        {streamingSources.map((source: any, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => setPreviewSource(source)}
                            className="w-full flex items-center justify-between text-xs hover:bg-blue-100 dark:hover:bg-blue-800/30 p-1 rounded transition"
                          >
                            <span className="text-blue-700 dark:text-blue-300 truncate">
                              {source.documentTitle}
                            </span>
                            <span className="text-blue-600 dark:text-blue-400 ml-2 flex-shrink-0">
                              {(source.score * 100).toFixed(0)}% match
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Loading indicator */}
            {isStreaming && !streamingMessage && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                  <SparklesIcon className="h-5 w-5 text-primary-600 animate-pulse" />
                </div>
                <div className="max-w-3xl">
                  <div className="rounded-lg p-4 bg-gray-100 dark:bg-gray-700">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Thinking...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <SparklesIcon className="mx-auto h-12 w-12 mb-2" />
            <p>Start the conversation by sending a message</p>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center space-x-4">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={isStreaming}
          className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 focus:border-transparent disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!message.trim() || isStreaming}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <span>{isStreaming ? 'Sending...' : 'Send'}</span>
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>
      </form>

      {/* Source Preview Modal */}
      {previewSource && (
        <SourcePreviewModal
          isOpen={!!previewSource}
          onClose={() => setPreviewSource(null)}
          documentId={previewSource.documentId}
          chunkId={previewSource.chunkId}
          documentTitle={previewSource.documentTitle}
          score={previewSource.score}
        />
      )}
    </div>
  )
}
