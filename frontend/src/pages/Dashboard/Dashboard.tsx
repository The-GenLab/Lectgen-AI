import { useState } from 'react';
import { 
  Layout, 
  Button, 
  List, 
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
  AudioOutlined
} from '@ant-design/icons';
import AudioRecorder from '../../components/AudioRecorder';
import styles from './Dashboard.module.css';

const { Sider, Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

export default function Dashboard() {
  const [input, setInput] = useState('');
  const [currentChat] = useState('Marketing Strategy 2024');
  const [activeTab, setActiveTab] = useState('text');

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

  const handleSend = () => {
    if (!input.trim()) return;
    console.log('Send:', input);
    setInput('');
  };

  const handleTranscriptReady = (transcript: string) => {
    setInput(transcript);
    setActiveTab('text');
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
              <List
                dataSource={chatHistory.today}
                renderItem={item => (
                  <List.Item 
                    className={item.active ? styles.chatItemActive : styles.chatItem}
                  >
                    <FileTextOutlined className={styles.chatIcon} />
                    <Text className={styles.chatTitle}>{item.title}</Text>
                  </List.Item>
                )}
              />
            </div>

            <div className={styles.historySection}>
              <Text className={styles.sectionLabel}>YESTERDAY</Text>
              <List
                dataSource={chatHistory.yesterday}
                renderItem={item => (
                  <List.Item className={styles.chatItem}>
                    <FileTextOutlined className={styles.chatIcon} />
                    <Text className={styles.chatTitle}>{item.title}</Text>
                  </List.Item>
                )}
              />
            </div>

            <div className={styles.historySection}>
              <Text className={styles.sectionLabel}>PREVIOUS 7 DAYS</Text>
              <List
                dataSource={chatHistory.previous}
                renderItem={item => (
                  <List.Item className={styles.chatItem}>
                    <FileTextOutlined className={styles.chatIcon} />
                    <Text className={styles.chatTitle}>{item.title}</Text>
                  </List.Item>
                )}
              />
            </div>
          </div>

          {/* Bottom Section */}
          <div className={styles.siderBottom}>
            {/* Usage */}
            <div className={styles.usageSection}>
              <Text className={styles.usageLabel}>Daily Limit</Text>
              <Text className={styles.usageText}>2/5 slides generated</Text>
              <Progress 
                percent={40} 
                showInfo={false}
                strokeColor="#1677FF"
              />
            </div>

            <Divider style={{ margin: '12px 0' }} />

            {/* User Card */}
            <div className={styles.userCard}>
              <Avatar size={40} icon={<UserOutlined />} className={styles.userAvatar} />
              <div className={styles.userInfo}>
                <Text strong className={styles.userName}>John Doe</Text>
                <Tag color="default" className={styles.userTag}>Free Plan</Tag>
              </div>
            </div>

            {/* Upgrade Button */}
            <Button 
              block
              size="large"
              className={styles.upgradeBtn}
              icon={<ThunderboltOutlined />}
            >
              Upgrade to VIP
            </Button>
          </div>
        </div>
      </Sider>

      {/* MAIN CONTENT */}
      <Layout>
        {/* Header */}
        <Header className={styles.header}>
          <Text className={styles.headerTitle}>
            Current Chat: <strong>{currentChat}</strong>
          </Text>
          <Button type="text" icon={<EllipsisOutlined />} />
        </Header>

        {/* Chat Content */}
        <Content className={styles.content}>
          <div className={styles.messagesContainer}>
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
                          className={styles.input}
                          suffix={
                            <Button
                              type="primary"
                              shape="circle"
                              icon={<SendOutlined />}
                              onClick={handleSend}
                              disabled={!input.trim()}
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
              ]}
            />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

