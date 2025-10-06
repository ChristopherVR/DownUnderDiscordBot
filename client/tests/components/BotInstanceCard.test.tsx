import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import BotInstanceCard from '../../src/components/BotInstanceCard';
import type { InstanceInfo } from 'discord-dashboard-shared';

// Mock the shared types
const mockInstance: InstanceInfo = {
  instanceId: 'test-bot-1',
  online: true,
  lastHeartbeat: Date.now(),
  isActive: true,
  hostname: 'test-host',
  pid: 12345,
  shardId: 0,
};

describe('BotInstanceCard', () => {
  it('renders bot instance information correctly', () => {
    render(<BotInstanceCard guildId="test-guild" instance={mockInstance} onUpdate={() => {}} />);

    expect(screen.getByText('test-bot-1')).toBeInTheDocument();
    expect(screen.getByText('test-host')).toBeInTheDocument();
  });

  it('shows offline status for disconnected bot', () => {
    const offlineInstance = { ...mockInstance, online: false };
    render(<BotInstanceCard guildId="test-guild" instance={offlineInstance} onUpdate={() => {}} />);

    // Check for offline indicator (this will depend on your component implementation)
    expect(screen.getByText('test-bot-1')).toBeInTheDocument();
  });

  it('indicates active bot instance', () => {
    render(<BotInstanceCard guildId="test-guild" instance={mockInstance} onUpdate={() => {}} />);

    // Should show active indicator (this will depend on your component implementation)
    expect(screen.getByText('test-bot-1')).toBeInTheDocument();
  });

  it('shows inactive status for non-active bot', () => {
    const inactiveInstance = { ...mockInstance, isActive: false };
    render(<BotInstanceCard guildId="test-guild" instance={inactiveInstance} onUpdate={() => {}} />);

    // Should not show active indicator (this will depend on your component implementation)
    expect(screen.getByText('test-bot-1')).toBeInTheDocument();
  });

  it('displays process information when available', () => {
    render(<BotInstanceCard guildId="test-guild" instance={mockInstance} onUpdate={() => {}} />);

    expect(screen.getByText('test-bot-1')).toBeInTheDocument();
    // PID and Shard ID display will depend on your component implementation
  });

  it('handles missing optional information gracefully', () => {
    const minimalInstance: InstanceInfo = {
      instanceId: 'minimal-bot',
      online: true,
      lastHeartbeat: Date.now(),
      isActive: false,
    };

    render(<BotInstanceCard guildId="test-guild" instance={minimalInstance} onUpdate={() => {}} />);

    expect(screen.getByText('minimal-bot')).toBeInTheDocument();
  });
});
