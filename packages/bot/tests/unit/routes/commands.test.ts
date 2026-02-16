import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { initializeCommandRoutes } from "../../../routes/commands";

type BroadcastOnly = { broadcastCommandResult: ReturnType<typeof vi.fn> };

const commandRegistryMock = vi.hoisted(() => ({
  loadKnownCommands: vi.fn(),
  registerCommand: vi.fn(),
  getCommandDefinitions: vi.fn(),
  getCommandHistory: vi.fn(),
  getCommandExecution: vi.fn(),
  clearHistory: vi.fn(),
  getStats: vi.fn(),
  validateArguments: vi.fn(),
}));

vi.mock("../../../helpers/commands/CommandRegistry", () => {
  const CommandRegistry = vi.fn().mockImplementation(() => commandRegistryMock);
  return { CommandRegistry };
});

const discordIntegrationMock = vi.hoisted(() => ({
  executeCommand: vi.fn(),
  validateCommandExecution: vi.fn(),
  getAvailableGuilds: vi.fn(),
  getAvailableChannels: vi.fn(),
}));

vi.mock("../../../helpers/commands/DiscordBotIntegration", () => ({
  DiscordBotIntegration: vi.fn().mockImplementation(() => discordIntegrationMock),
  registerDiscordIntegration: vi.fn(),
}));

vi.mock("../../../helpers/websocket", () => ({
  WebSocketManager: vi.fn().mockImplementation(() => ({ broadcastCommandResult: vi.fn() })),
}));

describe("Commands API routes", () => {
  let app: express.Application;
  let wsManager: BroadcastOnly;

  beforeEach(() => {
    vi.clearAllMocks();

    Object.values(commandRegistryMock).forEach((maybeMock) => {
      if (typeof maybeMock === "function" && "mockReset" in maybeMock) {
        maybeMock.mockReset();
      }
    });

    Object.values(discordIntegrationMock).forEach((maybeMock) => {
      if (typeof maybeMock === "function" && "mockReset" in maybeMock) {
        maybeMock.mockReset();
      }
    });

    commandRegistryMock.getCommandDefinitions.mockReturnValue([
      { name: "play", description: "Play music", options: [] },
    ]);
    commandRegistryMock.getCommandHistory.mockReturnValue([
      { id: "1", command: "play", arguments: {}, timestamp: Date.now(), status: "success" },
    ]);
    commandRegistryMock.getCommandExecution.mockReturnValue({
      id: "1",
      command: "play",
      arguments: {},
      timestamp: Date.now(),
      status: "success",
    });
    commandRegistryMock.getStats.mockReturnValue({
      totalCommands: 1,
      totalExecutions: 10,
      successfulExecutions: 9,
      failedExecutions: 1,
      mostUsedCommands: [],
    });
    commandRegistryMock.validateArguments.mockReturnValue({ valid: true, errors: [] });
    commandRegistryMock.loadKnownCommands.mockResolvedValue();

    discordIntegrationMock.executeCommand.mockResolvedValue({ success: true, id: "exec-1" });
    discordIntegrationMock.validateCommandExecution.mockResolvedValue({ valid: true });
    discordIntegrationMock.getAvailableGuilds.mockResolvedValue([{ id: "guild-1", name: "Guild One" }]);
    discordIntegrationMock.getAvailableChannels.mockResolvedValue([
      { id: "channel-1", name: "#general", type: "text" },
    ]);

    wsManager = { broadcastCommandResult: vi.fn() };

    app = express();
    app.use(express.json());
    app.use("/api/commands", initializeCommandRoutes(wsManager));
  });

  it("returns command definitions", async () => {
    const response = await request(app).get("/api/commands/registry").expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.commands).toHaveLength(1);
  });

  it("executes commands through the integration layer", async () => {
    const response = await request(app)
      .post("/api/commands/execute")
      .send({ command: "play", arguments: { query: "song" } })
      .expect(200);

    expect(discordIntegrationMock.executeCommand).toHaveBeenCalledWith("play", { query: "song" }, undefined, undefined, undefined);
    expect(wsManager.broadcastCommandResult).toHaveBeenCalled();
    expect(response.body.success).toBe(true);
  });

  it("returns execution history entries", async () => {
    const response = await request(app).get("/api/commands/history").expect(200);
    expect(response.body.history).toHaveLength(1);
  });

  it("handles missing execution lookups", async () => {
    commandRegistryMock.getCommandExecution.mockReturnValueOnce(undefined);
    const response = await request(app).get("/api/commands/history/unknown").expect(404);
    expect(response.body.success).toBe(false);
  });

  it("clears execution history", async () => {
    await request(app).delete("/api/commands/history").expect(200);
    expect(commandRegistryMock.clearHistory).toHaveBeenCalled();
  });

  it("validates incoming arguments", async () => {
    const response = await request(app)
      .post("/api/commands/validate")
      .send({ command: "play", arguments: {} })
      .expect(200);
    expect(response.body.validation.valid).toBe(true);
  });

  it("exposes guild and channel helpers", async () => {
    const guildResponse = await request(app).get("/api/commands/guilds").expect(200);
    expect(guildResponse.body.guilds).toHaveLength(1);

    const channelResponse = await request(app).get("/api/commands/guilds/guild-1/channels").expect(200);
    expect(channelResponse.body.channels).toHaveLength(1);
  });
});
