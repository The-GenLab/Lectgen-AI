import { useState, useEffect } from 'react';
import {
  Layout,
  Button,
  Avatar,
  Tag,
  Card,
  Input,
  Space,
  Progress,
  Typography,
  Divider,
  Tabs
} from 'antd';
import {
  PlusOutlined,
  FileTextOutlined,
  EllipsisOutlined,
  DownloadOutlined,
  ReloadOutlined,
  EditOutlined,
  SendOutlined,
  RobotOutlined,
  UserOutlined,
  ThunderboltOutlined,
  AudioOutlined,
  PictureOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import AudioRecorder from '../../components/AudioRecorder';
import { TemplateAnalyzer } from '../../components/FileUploadPanel';
import { uploadTemplateImage } from '../../api/template';
import { getCurrentUser, logout } from '../../utils/auth';
import { getProfile } from '../../api/user';
import { getAvatarUrl } from '../../utils/file';
import { sendMessage, type Message as ChatMessage } from '../../api/chat';
import { message as antdMessage } from 'antd';
import styles from './Dashboard.module.css';

const { Sider, Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [conversationTitle, setConversationTitle] = useState('New Conversation');
  const [activeTab, setActiveTab] = useState('text');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data
  const chatHistory = {
    today: [
      { id: '1', title: 'Marketing Strategy 2024', active: true }
    ],
    yesterday: [
      { id: '2', title: 'Biology 101 Lecture' },
      { id: '3', title: 'Startup Pitch Deck' }
    ],
    previous: [
      { id: '4', title: 'History 101: WWII' },
      { id: '5', title: 'Project Alpha Roadmap' }
    ]
  };

  const suggestions = [
    { icon: <ThunderboltOutlined />, label: 'Startup Pitch' },
    { icon: <FileTextOutlined />, label: 'University Lecture' },
    { icon: <FileTextOutlined />, label: 'Quarterly Review' }
  ];

  // Load user info on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Try to get full profile from API (includes name and avatarUrl)
        const response = await getProfile();
        if (response.success && response.data?.user) {
          setCurrentUser(response.data.user);
          // Update localStorage with full user data
          localStorage.setItem('user', JSON.stringify(response.data.user));
        } else {
          // Fallback to localStorage
          const user = getCurrentUser();
          setCurrentUser(user);
        }
      } catch (error) {
        console.error('Failed to load user profile:', error);
        // Fallback to localStorage
        const user = getCurrentUser();
        setCurrentUser(user);
      }
    };
    
    loadUserData();
  }, []);

  // Get user display name
  const getUserDisplayName = () => {
    if (!currentUser) return 'User';
    if (currentUser.name) return currentUser.name;
    if (currentUser.email) return currentUser.email.split('@')[0];
    return 'User';
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    const displayName = getUserDisplayName();
    const words = displayName.split(' ').filter(w => w.length > 0);
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  };

  // Get role display text
  const getRoleDisplay = () => {
    if (!currentUser?.role) return 'Free Plan';
    const role = currentUser.role.toUpperCase();
    if (role === 'VIP') return 'VIP';
    if (role === 'ADMIN') return 'Admin';
    return 'Free Plan';
  };

  // Get role tag color
  const getRoleTagColor = () => {
    if (!currentUser?.role) return 'default';
    const role = currentUser.role.toUpperCase();
    if (role === 'VIP') return 'gold';
    if (role === 'ADMIN') return 'red';
    return 'default';
  };

  // Calculate daily limit (approximate: monthly / 30)
  const getDailyLimit = () => {
    if (!currentUser?.maxSlidesPerMonth) return 5;
    // Calculate approximate daily limit (monthly / 30, rounded up)
    return Math.ceil(currentUser.maxSlidesPerMonth / 30);
  };

  // Calculate daily usage (approximate: monthly generated / 30)
  const getDailyUsage = () => {
    if (!currentUser?.slidesGenerated) return 0;
    // Calculate approximate daily usage (monthly generated / 30, rounded down)
    return Math.floor(currentUser.slidesGenerated / 30);
  };

  // Get usage percentage
  const getUsagePercentage = () => {
    const dailyLimit = getDailyLimit();
    const dailyUsage = getDailyUsage();
    if (dailyLimit === 0) return 0;
    return Math.min(Math.round((dailyUsage / dailyLimit) * 100), 100);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect even if API call fails
      window.location.href = '/login';
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userPrompt = input;
    setInput(''); // Clear input immediately
    setIsLoading(true);

    try {
      // Call chat API
      const response = await sendMessage({
        conversationId,
        messageType: 'TEXT',
        contentText: userPrompt,
      });

      // Update conversation ID and title if new
      if (!conversationId) {
        setConversationId(response.data.conversation.id);
        setConversationTitle(response.data.conversation.title);
      }

      // Add both user and assistant messages
      setMessages([
        ...messages,
        response.data.userMessage,
        response.data.assistantMessage,
      ]);

      antdMessage.success('Đã tạo bài thuyết trình LaTeX!');
    } catch (error: any) {
      console.error('Error sending message:', error);
      antdMessage.error(error.response?.data?.message || 'Không thể tạo bài thuyết trình');
      // Restore input if failed
      setInput(userPrompt);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranscriptReady = (transcript: string) => {
    setInput(transcript);
    setActiveTab('text');
  };

  const handleImageUploadConfirm = async (
    templateImage: File | null,
    topic: string,
    analysisResult: any
  ) => {
    if (!templateImage || !topic.trim()) {
      antdMessage.warning('Vui lòng upload ảnh template và nhập chủ đề!');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Uploading template and generating presentation...');
      console.log('Topic:', topic);
      console.log('Analysis:', analysisResult);

      // 1. Upload template to MinIO
      const uploadedTemplate = await uploadTemplateImage(templateImage);
      console.log('Template uploaded:', uploadedTemplate);
      
      if (!uploadedTemplate.fileUrl) {
        throw new Error('Template upload failed - no fileUrl returned');
      }

      // 2. Call chat API with IMAGE type and style analysis
      console.log('Calling chat API with:', {
        messageType: 'IMAGE',
        contentText: topic,
        imageUrl: uploadedTemplate.fileUrl,
        styleAnalysis: analysisResult,
      });

      const response = await sendMessage({
        conversationId,
        messageType: 'IMAGE',
        contentText: topic,
        imageUrl: uploadedTemplate.fileUrl,
        styleAnalysis: analysisResult,
      });

      // Update conversation ID and title if new
      if (!conversationId) {
        setConversationId(response.data.conversation.id);
        setConversationTitle(response.data.conversation.title);
      }

      // Add both user and assistant messages
      setMessages([
        ...messages,
        response.data.userMessage,
        response.data.assistantMessage,
      ]);

      antdMessage.success('Đã tạo bài thuyết trình LaTeX theo mẫu!');
      
      // Switch về text tab
      setActiveTab('text');
    } catch (error: any) {
      console.error('Error generating from template:', error);
      console.error('Error details:', error.response?.data);
      
      const errorMsg = error.response?.data?.message 
        || error.message 
        || 'Không thể tạo bài thuyết trình từ template';
      
      antdMessage.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout className={styles.layout}>
      {/* LEFT SIDEBAR */}
      <Sider width={260} className={styles.sider}>
        <div className={styles.siderContent}>
          {/* Logo */}
          <div className={styles.logo}>
            <div className={styles.logoIcon}>🎓</div>
            <Title level={4} className={styles.logoText}>LectGen-AI</Title>
          </div>

          {/* New Presentation Button */}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            block
            className={styles.newPresentationBtn}
          >
            New Presentation
          </Button>

          {/* Chat History */}
          <div className={styles.chatHistory}>
            <div className={styles.historySection}>
              <Text className={styles.sectionLabel}>TODAY</Text>
              <div>
                {chatHistory.today.map((item, index) => (
                  <div
                    key={index}
                    className={item.active ? styles.chatItemActive : styles.chatItem}
                  >
                    <FileTextOutlined className={styles.chatIcon} />
                    <Text className={styles.chatTitle}>{item.title}</Text>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.historySection}>
              <Text className={styles.sectionLabel}>YESTERDAY</Text>
              <div>
                {chatHistory.yesterday.map((item, index) => (
                  <div key={index} className={styles.chatItem}>
                    <FileTextOutlined className={styles.chatIcon} />
                    <Text className={styles.chatTitle}>{item.title}</Text>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.historySection}>
              <Text className={styles.sectionLabel}>PREVIOUS 7 DAYS</Text>
              <div>
                {chatHistory.previous.map((item, index) => (
                  <div key={index} className={styles.chatItem}>
                    <FileTextOutlined className={styles.chatIcon} />
                    <Text className={styles.chatTitle}>{item.title}</Text>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className={styles.siderBottom}>
            {/* Usage */}
            {currentUser && (
              <div className={styles.usageSection}>
                <Text className={styles.usageLabel}>Daily Limit</Text>
                <Text className={styles.usageText}>
                  {getDailyUsage()}/{getDailyLimit()} slides generated
                </Text>
                <Progress
                  percent={getUsagePercentage()}
                  showInfo={false}
                  strokeColor="#1677FF"
                />
              </div>
            )}

            <Divider style={{ margin: '12px 0' }} />

            {/* User Card */}
            <div className={styles.userCard}>
              {currentUser?.avatarUrl && getAvatarUrl(currentUser.avatarUrl) ? (
                <Avatar
                  size={40}
                  src={getAvatarUrl(currentUser.avatarUrl)!}
                  className={styles.userAvatar}
                />
              ) : (
                <Avatar size={40} className={styles.userAvatar}>
                  {getUserInitials()}
                </Avatar>
              )}
              <div className={styles.userInfo}>
                <Text strong className={styles.userName}>
                  {getUserDisplayName()}
                </Text>
                <Tag color={getRoleTagColor()} className={styles.userTag}>
                  {getRoleDisplay()}
                </Tag>
              </div>
            </div>

            {/* Upgrade Button - Only show for FREE users */}
            {currentUser?.role?.toUpperCase() === 'FREE' && (
              <Button
                block
                size="large"
                className={styles.upgradeBtn}
                icon={<ThunderboltOutlined />}
                style={{ marginBottom: 8 }}
              >
                Upgrade to VIP
              </Button>
            )}

            {/* Logout Button */}
            <Button
              block
              size="large"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              className={styles.logoutBtn}
            >
              Đăng xuất
            </Button>
          </div>
        </div>
      </Sider>

      {/* MAIN CONTENT */}
      <Layout>
        {/* Header */}
        <Header className={styles.header}>
          <Text className={styles.headerTitle}>
            Current Chat: <strong>{conversationTitle}</strong>
          </Text>
          <Button type="text" icon={<EllipsisOutlined />} />
        </Header>

        {/* Chat Content */}
        <Content className={styles.content}>
          <div className={styles.messagesContainer}>
            {/* Render dynamic messages */}
            {messages.length > 0 ? (
              messages.map((msg) => (
                <div key={msg.id} className={styles.messageRow}>
                  {msg.role === 'USER' ? (
                    // User message
                    <div className={styles.userMessage}>
                      <div className={styles.messageBubble}>
                        <Text className={styles.messageText}>
                          {msg.contentText}
                        </Text>
                        <Text className={styles.timestamp}>
                          {new Date(msg.createdAt).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </Text>
                      </div>
                    </div>
                  ) : (
                    // AI message
                    <div className={styles.aiMessage}>
                      <Avatar
                        icon={<RobotOutlined />}
                        className={styles.aiAvatar}
                        size={32}
                      />
                      <div>
                        <div className={styles.aiTextBubble}>
                          <Text>
                            Đã tạo bài thuyết trình LaTeX ({msg.slideCount || 0} slides)
                          </Text>
                        </div>

                        {/* LaTeX Code Card */}
                        <Card className={styles.presentationCard}>
                          <div className={styles.cardContent}>
                            <div className={styles.thumbnail}>
                              <div className={styles.thumbnailPlaceholder}>
                                <FileTextOutlined style={{ fontSize: 48, color: '#1677FF' }} />
                              </div>
                              <div className={styles.slideOverlay}>LaTeX</div>
                            </div>

                            <div className={styles.cardDetails}>
                              <div className={styles.cardHeader}>
                                <Title level={5} className={styles.cardTitle}>
                                  Bài thuyết trình LaTeX
                                </Title>
                                <Tag color="success" className={styles.readyTag}>READY</Tag>
                              </div>

                              <Paragraph className={styles.cardDescription}>
                                {msg.slideCount} slides • LaTeX Beamer presentation
                              </Paragraph>

                              <div className={styles.cardMeta}>
                                <Space size={16}>
                                  <Text type="secondary">📊 {msg.slideCount} Slides</Text>
                                  <Text type="secondary">⏱ {new Date(msg.createdAt).toLocaleTimeString()}</Text>
                                  <Text type="secondary">📝 {msg.contentText?.length || 0} chars</Text>
                                </Space>
                              </div>

                              <div className={styles.cardActions}>
                                <Button
                                  type="primary"
                                  icon={<DownloadOutlined />}
                                  size="large"
                                  className={styles.downloadBtn}
                                  onClick={() => {
                                    // Download LaTeX as .tex file
                                    const blob = new Blob([msg.contentText || ''], { type: 'text/plain' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `presentation-${msg.id}.tex`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                  }}
                                >
                                  Download LaTeX
                                </Button>
                                <Button
                                  icon={<EditOutlined />}
                                  size="large"
                                  onClick={() => {
                                    // Copy LaTeX to clipboard
                                    navigator.clipboard.writeText(msg.contentText || '');
                                    antdMessage.success('Đã copy LaTeX code!');
                                  }}
                                >
                                  Copy Code
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>

                        <Text className={styles.timestamp}>
                          {new Date(msg.createdAt).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </Text>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              // Show placeholder when no messages
              <>
                {/* User Message */}
                <div className={styles.messageRow}>
                  <div className={styles.userMessage}>
                    <div className={styles.messageBubble}>
                      <Text className={styles.messageText}>
                        I need a presentation for our 2024 Marketing Strategy. It should cover our Q1
                        achievements, Q2 goals, and the new social media campaign. Keep it professional
                        and clean. About 10 slides.
                      </Text>
                      <Text className={styles.timestamp}>10:42 AM</Text>
                    </div>
                  </div>
                </div>

                {/* AI Response */}
                <div className={styles.messageRow}>
                  <div className={styles.aiMessage}>
                    <Avatar
                      icon={<RobotOutlined />}
                      className={styles.aiAvatar}
                      size={32}
                    />
                    <div>
                      <div className={styles.aiTextBubble}>
                        <Text>
                          I've generated a draft for your 2024 Marketing Strategy. It includes sections for Q1 review,
                          Q2 objectives, and a detailed breakdown of the social media channels.
                        </Text>
                      </div>

                      {/* Presentation Card */}
                      <Card className={styles.presentationCard}>
                        <div className={styles.cardContent}>
                          {/* Thumbnail */}
                          <div className={styles.thumbnail}>
                            <div className={styles.thumbnailPlaceholder}>
                              <FileTextOutlined style={{ fontSize: 48, color: '#1677FF' }} />
                            </div>
                            <div className={styles.slideOverlay}>Cover Slide</div>
                          </div>

                          {/* Details */}
                          <div className={styles.cardDetails}>
                            <div className={styles.cardHeader}>
                              <Title level={5} className={styles.cardTitle}>
                                Marketing Strategy 2024
                              </Title>
                              <Tag color="success" className={styles.readyTag}>READY</Tag>
                            </div>

                            <Paragraph className={styles.cardDescription}>
                              Comprehensive deck covering Q1 objectives, Q2 OKRs, and
                              Social Media tactical roadmap.
                            </Paragraph>

                            <div className={styles.cardMeta}>
                              <Space size={16}>
                                <Text type="secondary">📊 10 Slides</Text>
                                <Text type="secondary">⏱ ~30s gen time</Text>
                                <Text type="secondary">📁 2.4 MB</Text>
                              </Space>
                            </div>

                            <div className={styles.cardActions}>
                              <Button
                                type="primary"
                                icon={<DownloadOutlined />}
                                size="large"
                                className={styles.downloadBtn}
                              >
                                Download PDF
                              </Button>
                              <Button
                                icon={<ReloadOutlined />}
                                size="large"
                              />
                              <Button
                                icon={<EditOutlined />}
                                size="large"
                              />
                            </div>
                          </div>
                        </div>
                      </Card>

                      <Text className={styles.timestamp}>10:43 AM</Text>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Input Area */}
          <div className={styles.inputArea}>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              centered
              items={[
                {
                  key: 'text',
                  label: (
                    <span>
                      <FileTextOutlined /> Text
                    </span>
                  ),
                  children: (
                    <>
                      {/* Suggestion Chips */}
                      <div className={styles.suggestions}>
                        {suggestions.map((item, index) => (
                          <Button
                            key={index}
                            icon={item.icon}
                            className={styles.suggestionChip}
                          >
                            {item.label}
                          </Button>
                        ))}
                      </div>

                      {/* Input Bar */}
                      <div className={styles.inputBar}>
                        <Input
                          size="large"
                          placeholder="Describe your topic (e.g., 'History of Jazz Music with 5 slides')..."
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onPressEnter={handleSend}
                          disabled={isLoading}
                          className={styles.input}
                          suffix={
                            <Button
                              type="primary"
                              shape="circle"
                              icon={<SendOutlined />}
                              onClick={handleSend}
                              disabled={!input.trim() || isLoading}
                              loading={isLoading}
                              className={styles.sendBtn}
                            />
                          }
                        />
                      </div>

                      <Text type="secondary" className={styles.disclaimer}>
                        AI can make mistakes. Please review generated slides before presenting.
                      </Text>
                    </>
                  ),
                },
                {
                  key: 'audio',
                  label: (
                    <span>
                      <AudioOutlined /> Audio Input
                    </span>
                  ),
                  children: <AudioRecorder onTranscriptReady={handleTranscriptReady} />,
                },
                {
                  key: 'image',
                  label: (
                    <span>
                      <PictureOutlined /> Image / Template Input
                    </span>
                  ),
                  children: <TemplateAnalyzer onConfirm={handleImageUploadConfirm} />,
                },
              ]}
            />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}