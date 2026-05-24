import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  Ticket,
  Search,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  AlertTriangle,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Minimize2,
  Maximize2,
  Brain,
  Zap,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Database,
  Shield,
} from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Badge } from './components/ui/badge';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { useTicketList } from './generated/hooks/use-ticket';
import type { Ticket as TicketType } from './generated/models/ticket-model';
import { STATUS_CONFIG, PRIORITY_CONFIG, isTicketOverdue } from './lib/ticket-utils';
import { CATEGORY_ICONS } from './lib/category-data';
import { processWithCopilot, PREDEFINED_QA_DATABASE, getQACategories, type PredefinedQA } from './lib/copilot-service';

type MessageRole = 'user' | 'assistant' | 'system';
type MessageType = 'text' | 'ticket-list' | 'ticket-detail' | 'knowledge' | 'suggestion' | 'quick-actions' | 'qa-categories';

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  type: MessageType;
  data?: TicketType[] | TicketType | QuickAction[] | QACategory[];
  timestamp: Date;
  feedback?: 'positive' | 'negative';
  confidence?: number;
  suggestedActions?: string[];
  sourceType?: 'predefined_qa' | 'knowledge_base' | 'ticket_data' | 'generated';
  sourceId?: string;
}

interface QuickAction {
  id: string;
  label: string;
  icon: typeof Ticket;
  action: string;
  description?: string;
}

interface QACategory {
  name: string;
  count: number;
  icon: typeof HelpCircle;
  questions: string[];
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'create', label: 'Create', icon: Ticket, action: 'create', description: 'New ticket' },
  { id: 'status', label: 'Status', icon: Search, action: 'status', description: 'Check ticket' },
  { id: 'faq', label: 'FAQ', icon: BookOpen, action: 'faq', description: 'Common Q&A' },
  { id: 'help', label: 'Guide', icon: HelpCircle, action: 'help', description: 'App help' },
];

const SUGGESTED_QUERIES = [
  'Show my open tickets',
  'Check ticket status',
  'Request new equipment',
  'Outlook keeps crashing',
];

// Build QA categories from predefined database
function buildQACategories(): QACategory[] {
  const categories = getQACategories();
  const categoryIcons: Record<string, typeof HelpCircle> = {
    'Account Access': Shield,
    'Network': Zap,
    'Email': Search,
    'Communication': MessageSquare,
    'Hardware': Database,
    'Software': Lightbulb,
    'Support': Ticket,
    'Security': AlertTriangle,
  };
  
  return categories.map((name: string) => {
    const qas = PREDEFINED_QA_DATABASE.filter((qa: PredefinedQA) => qa.category === name);
    return {
      name,
      count: qas.length,
      icon: categoryIcons[name] || HelpCircle,
      questions: qas.slice(0, 3).map((qa: PredefinedQA) => qa.questions[0])
    };
  });
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showFAQ, setShowFAQ] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { data: tickets = [] } = useTicketList();

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, isMinimized]);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "👋 Hi! I'm your AI-powered IT Help Desk assistant with **Copilot RAG**. I can help you create tickets, check status, find solutions from our knowledge base, and answer common IT questions. What can I help you with?",
        type: 'quick-actions',
        data: QUICK_ACTIONS,
        timestamp: new Date(),
        confidence: 1.0,
        sourceType: 'generated',
      }]);
    }
  }, [isOpen, messages.length]);

  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

  const addMessage = (role: MessageRole, content: string, type: MessageType = 'text', data?: ChatMessage['data'], extras?: Partial<ChatMessage>) => {
    const newMessage: ChatMessage = {
      id: generateId(),
      role,
      content,
      type,
      data,
      timestamp: new Date(),
      ...extras,
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  };

  const processUserMessage = useCallback(async (message: string) => {
    setShowSuggestions(false);
    setShowFAQ(false);
    setIsTyping(true);
    
    // Add to conversation history
    const updatedHistory = [...conversationHistory, { role: 'user' as const, content: message }];
    setConversationHistory(updatedHistory);

    try {
      // Process with Copilot RAG service
      const response = await processWithCopilot({
        tickets,
        conversationHistory: updatedHistory,
        userQuery: message,
      });

      // Add to conversation history
      setConversationHistory((prev) => [...prev, { role: 'assistant', content: response.message }]);

      // Determine message type and data based on response
      let messageType: MessageType = 'text';
      let messageData: ChatMessage['data'] = undefined;

      if (response.data?.tickets && response.data.tickets.length > 0) {
        messageType = 'ticket-list';
        messageData = response.data.tickets;
      } else if (response.data?.ticket) {
        messageType = 'ticket-detail';
        messageData = response.data.ticket;
      }

      // Handle navigation for ticket creation
      if (message.toLowerCase().includes('create') && message.toLowerCase().includes('ticket')) {
        setTimeout(() => navigate('/create'), 100);
      }

      addMessage('assistant', response.message, messageType, messageData, {
        confidence: response.confidence,
        suggestedActions: response.suggestedActions,
        sourceType: response.sourceType,
        sourceId: response.sourceId,
      });

    } catch (error: unknown) {
      console.error('Copilot processing error:', error);
      addMessage(
        'assistant',
        'I apologize, but I encountered an error processing your request. Please try again or contact support if the issue persists.',
        'text'
      );
    }

    setIsTyping(false);
  }, [tickets, navigate, conversationHistory]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    addMessage('user', inputValue.trim());
    const userMessage = inputValue.trim();
    setInputValue('');
    processUserMessage(userMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'create':
        addMessage('user', 'Create a new ticket');
        processUserMessage('I want to create a new support ticket');
        break;
      case 'status':
        addMessage('user', 'Check ticket status');
        processUserMessage('How do I check my ticket status?');
        break;
      case 'faq':
        setShowFAQ(true);
        addMessage('assistant', '📚 **Frequently Asked Questions**\n\nBrowse by category or ask me anything:', 'qa-categories', buildQACategories());
        break;
      case 'help':
        addMessage('user', 'How do I use this app?');
        processUserMessage('Give me a guide on how to use this help desk app');
        break;
      default:
        break;
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    addMessage('user', suggestion);
    setInputValue('');
    processUserMessage(suggestion);
  };

  const handleFeedback = (messageId: string, feedback: 'positive' | 'negative') => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, feedback } : msg
      )
    );
  };

  const handleReset = () => {
    setMessages([]);
    setConversationHistory([]);
    setShowSuggestions(true);
    setShowFAQ(false);
    setExpandedCategory(null);
    setTimeout(() => {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "👋 Hi! I'm your AI-powered IT Help Desk assistant with **Copilot RAG**. I can help you create tickets, check status, find solutions from our knowledge base, and answer common IT questions. What can I help you with?",
        type: 'quick-actions',
        data: QUICK_ACTIONS,
        timestamp: new Date(),
        confidence: 1.0,
        sourceType: 'generated',
      }]);
    }, 100);
  };

  const renderTicketCard = (ticket: TicketType) => (
    <motion.div
      key={ticket.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer group"
      onClick={() => navigate(`/tickets/${ticket.id}`)}
    >
      <div className="flex items-start gap-2">
        <span className="text-lg">{CATEGORY_ICONS[ticket.mainCategory || ''] || '📝'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
            {ticket.title}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {ticket.ticketNumber || ticket.id.slice(0, 8)}
            </Badge>
            <Badge className={`text-xs ${PRIORITY_CONFIG[ticket.priorityKey].badgeClass}`}>
              {PRIORITY_CONFIG[ticket.priorityKey].label}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {STATUS_CONFIG[ticket.statusKey].label}
            </Badge>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </motion.div>
  );

  const renderTicketDetail = (ticket: TicketType) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border rounded-lg p-4 space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <Badge variant="outline" className="text-xs mb-2">
            {ticket.ticketNumber || ticket.id.slice(0, 8)}
          </Badge>
          <h4 className="font-semibold text-foreground">{ticket.title}</h4>
        </div>
        <span className="text-2xl">{CATEGORY_ICONS[ticket.mainCategory || ''] || '📝'}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Status:</span>
          <Badge className={STATUS_CONFIG[ticket.statusKey].badgeClass}>
            {STATUS_CONFIG[ticket.statusKey].label}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Priority:</span>
          <Badge className={PRIORITY_CONFIG[ticket.priorityKey].badgeClass}>
            {PRIORITY_CONFIG[ticket.priorityKey].label}
          </Badge>
        </div>
      </div>

      {ticket.assignedTo && (
        <div className="text-sm">
          <span className="text-muted-foreground">Assigned to: </span>
          <span className="font-medium">{ticket.assignedTo}</span>
        </div>
      )}

      {isTicketOverdue(ticket) && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertTriangle className="h-4 w-4" />
          <span>SLA Breached</span>
        </div>
      )}

      <Button
        size="sm"
        className="w-full mt-2"
        onClick={() => navigate(`/tickets/${ticket.id}`)}
      >
        View Full Details
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </motion.div>
  );

  const renderQACategories = (categories: QACategory[]) => (
    <div className="space-y-2 mt-2">
      {categories.map((category: QACategory) => {
        const Icon = category.icon;
        const isExpanded = expandedCategory === category.name;
        
        return (
          <motion.div
            key={category.name}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="border rounded-lg overflow-hidden"
          >
            <button
              className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
              onClick={() => setExpandedCategory(isExpanded ? null : category.name)}
            >
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{category.name}</p>
                  <p className="text-xs text-muted-foreground">{category.count} questions</p>
                </div>
              </div>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t bg-muted/30"
                >
                  <div className="p-2 space-y-1">
                    {category.questions.map((question: string, idx: number) => (
                      <button
                        key={idx}
                        className="w-full text-left text-xs p-2 rounded hover:bg-primary/10 transition-colors text-foreground"
                        onClick={() => handleSuggestionClick(question)}
                      >
                        → {question}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );

  const renderQuickActions = (actions: QuickAction[]) => (
    <div className="grid grid-cols-4 gap-1.5 mt-2">
      {actions.map((action: QuickAction) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.id}
            variant="outline"
            size="sm"
            className="h-auto py-2 px-1.5 flex flex-col items-center gap-1 hover:bg-primary/10 hover:border-primary"
            onClick={() => handleQuickAction(action.action)}
          >
            <Icon className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-medium text-center leading-tight">{action.label}</span>
          </Button>
        );
      })}
    </div>
  );

  const renderSourceBadge = (sourceType?: string) => {
    if (!sourceType) return null;
    
    const sourceConfig: Record<string, { label: string; className: string }> = {
      'predefined_qa': { label: 'FAQ', className: 'bg-primary/10 text-primary' },
      'knowledge_base': { label: 'KB', className: 'bg-secondary text-secondary-foreground' },
      'ticket_data': { label: 'Data', className: 'bg-accent text-accent-foreground' },
      'generated': { label: 'AI', className: 'bg-muted text-muted-foreground' },
    };
    
    const config = sourceConfig[sourceType];
    if (!config) return null;
    
    return (
      <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${config.className}`}>
        {config.label}
      </Badge>
    );
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';

    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
      >
        <Avatar className={`h-8 w-8 flex-shrink-0 ${isUser ? 'bg-primary' : 'bg-muted'}`}>
          <AvatarFallback className={isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}>
            {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>

        <div className={`flex-1 min-w-0 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
          <div
            className={`inline-block rounded-2xl px-4 py-2.5 text-sm ${
              isUser
                ? 'bg-primary text-primary-foreground rounded-br-md'
                : 'bg-muted text-foreground rounded-bl-md'
            }`}
          >
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
          
          {/* Source and confidence indicator */}
          {!isUser && (message.sourceType || (message.confidence !== undefined && message.confidence < 0.7)) && (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {renderSourceBadge(message.sourceType)}
              {message.confidence !== undefined && message.confidence < 0.7 && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  {Math.round(message.confidence * 100)}% confidence
                </span>
              )}
            </div>
          )}

          {/* Render data based on type */}
          {message.type === 'ticket-list' && message.data && (
            <div className="space-y-2 mt-2">
              {(message.data as TicketType[]).map((ticket: TicketType) => renderTicketCard(ticket))}
            </div>
          )}

          {message.type === 'ticket-detail' && message.data && (
            <div className="mt-2">
              {renderTicketDetail(message.data as TicketType)}
            </div>
          )}

          {message.type === 'quick-actions' && message.data && (
            renderQuickActions(message.data as QuickAction[])
          )}

          {message.type === 'qa-categories' && message.data && (
            renderQACategories(message.data as QACategory[])
          )}

          {/* Suggested actions */}
          {!isUser && message.suggestedActions && message.suggestedActions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {message.suggestedActions.slice(0, 3).map((action: string) => (
                <Button
                  key={action}
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => handleSuggestionClick(action)}
                >
                  <Zap className="h-3 w-3 mr-1" />
                  {action}
                </Button>
              ))}
            </div>
          )}

          {/* Feedback buttons for assistant messages */}
          {!isUser && message.type !== 'quick-actions' && message.type !== 'qa-categories' && (
            <div className="flex items-center gap-1 mt-1">
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 w-6 p-0 ${message.feedback === 'positive' ? 'text-primary' : 'text-muted-foreground'}`}
                onClick={() => handleFeedback(message.id, 'positive')}
              >
                <ThumbsUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 w-6 p-0 ${message.feedback === 'negative' ? 'text-destructive' : 'text-muted-foreground'}`}
                onClick={() => handleFeedback(message.id, 'negative')}
              >
                <ThumbsDown className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50"
          >
            <Button
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all"
              onClick={() => setIsOpen(true)}
            >
              <MessageSquare className="h-6 w-6" />
            </Button>
            {/* Copilot RAG indicator */}
            <span className="absolute -top-1 -right-1 h-6 w-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Brain className="h-3.5 w-3.5 text-white" />
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? 56 : 'auto'
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] as const }}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[360px] max-w-[380px] bg-background border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: isMinimized ? 56 : 'min(500px, calc(100vh - 100px))' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
                  <Brain className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm flex items-center gap-1.5">
                    IT Copilot
                    <Badge className="bg-white/20 text-white text-[9px] px-1.5 py-0">RAG</Badge>
                  </h3>
                  <p className="text-xs opacity-80">Powered by AI + Knowledge Base</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-white hover:bg-white/20"
                  onClick={handleReset}
                  title="Reset conversation"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-white hover:bg-white/20"
                  onClick={() => setIsMinimized(!isMinimized)}
                  title={isMinimized ? 'Expand' : 'Minimize'}
                >
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-white hover:bg-white/20"
                  onClick={() => setIsOpen(false)}
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Chat Body */}
            {!isMinimized && (
              <>
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin" style={{ maxHeight: '320px', minHeight: '180px' }}>
                  <div className="p-4 space-y-4">
                    {messages.map((message: ChatMessage) => renderMessage(message))}

                    {/* Typing indicator */}
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-3"
                      >
                        <Avatar className="h-8 w-8 bg-muted">
                          <AvatarFallback className="bg-muted text-foreground">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                          <Brain className="h-4 w-4 text-primary animate-pulse" />
                          <span className="text-xs text-muted-foreground">Searching knowledge base...</span>
                          <div className="flex items-center gap-1">
                            <motion.span
                              animate={{ opacity: [0.4, 1, 0.4] }}
                              transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                              className="h-2 w-2 bg-primary rounded-full"
                            />
                            <motion.span
                              animate={{ opacity: [0.4, 1, 0.4] }}
                              transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                              className="h-2 w-2 bg-primary rounded-full"
                            />
                            <motion.span
                              animate={{ opacity: [0.4, 1, 0.4] }}
                              transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                              className="h-2 w-2 bg-primary rounded-full"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Suggestions */}
                {showSuggestions && messages.length <= 1 && (
                  <div className="px-4 pb-2">
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Try asking:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {SUGGESTED_QUERIES.slice(0, 4).map((query: string) => (
                        <Button
                          key={query}
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleSuggestionClick(query)}
                        >
                          {query}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="p-4 border-t bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Input
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Ask me anything..."
                      className="flex-1 bg-background"
                      disabled={isTyping}
                    />
                    <Button
                      size="icon"
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isTyping}
                      className="flex-shrink-0"
                    >
                      {isTyping ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
                    <Brain className="h-3 w-3" />
                    Copilot RAG • Predefined Q&A • Knowledge Base
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Chatbot;
