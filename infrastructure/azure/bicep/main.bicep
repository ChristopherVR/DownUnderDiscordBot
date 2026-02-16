@description('The environment name (dev, staging, prod)')
param environment string = 'prod'

@description('The Azure region for all resources')
param location string = resourceGroup().location

@description('The Discord bot token')
@secure()
param discordToken string

@description('The Discord client ID')
param discordClientId string

@description('Optional Spotify client ID')
param spotifyClientId string = ''

@description('Optional Spotify client secret')
@secure()
param spotifyClientSecret string = ''

var prefix = 'downunder-${environment}'
var tags = {
  project: 'down-under-discord-bot'
  environment: environment
}

// --- Log Analytics ---
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: '${prefix}-logs'
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// --- Container Registry ---
resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: replace('${prefix}acr', '-', '')
  location: location
  tags: tags
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: true
  }
}

// --- Container App Environment ---
resource containerEnv 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: '${prefix}-env'
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// --- Key Vault ---
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: '${prefix}-kv'
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: tenant().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
  }
}

resource discordTokenSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'discord-token'
  properties: {
    value: discordToken
  }
}

resource discordClientIdSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'discord-client-id'
  properties: {
    value: discordClientId
  }
}

// --- Container App (Bot) ---
resource botApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: '${prefix}-bot'
  location: location
  tags: tags
  properties: {
    managedEnvironmentId: containerEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 3001
        transport: 'auto'
      }
      registries: [
        {
          server: acr.properties.loginServer
          username: acr.listCredentials().username
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'acr-password'
          value: acr.listCredentials().passwords[0].value
        }
        {
          name: 'discord-token'
          value: discordToken
        }
        {
          name: 'discord-client-id'
          value: discordClientId
        }
        {
          name: 'spotify-client-id'
          value: spotifyClientId
        }
        {
          name: 'spotify-client-secret'
          value: spotifyClientSecret
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'bot'
          image: '${acr.properties.loginServer}/down-under-bot:latest'
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            { name: 'NODE_ENV', value: 'production' }
            { name: 'PORT', value: '3001' }
            { name: 'DISCORD_TOKEN', secretRef: 'discord-token' }
            { name: 'DISCORD_CLIENT_ID', secretRef: 'discord-client-id' }
            { name: 'SPOTIFY_CLIENT_ID', secretRef: 'spotify-client-id' }
            { name: 'SPOTIFY_CLIENT_SECRET', secretRef: 'spotify-client-secret' }
            { name: 'DATABASE_URL', value: 'file:./data/bot.db' }
            { name: 'FFMPEG_PATH', value: 'ffmpeg' }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 1
      }
    }
  }
}

// --- Outputs ---
output acrLoginServer string = acr.properties.loginServer
output botAppUrl string = 'https://${botApp.properties.configuration.ingress.fqdn}'
output keyVaultName string = keyVault.name
