import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CommandExecutor } from '@/components/CommandExecutor';
import { CommandHistory } from '@/components/CommandHistory';
import { useTranslation } from 'react-i18next';
import { CommandExecution } from 'discord-dashboard-shared';

export default function CommandInvocationPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('executor');

  const handleCommandExecuted = useCallback((execution: CommandExecution) => {
    // Optionally switch to history tab to show the result
    if (execution.status === 'success') {
      // Could add a toast notification here
      console.log('Command executed successfully:', execution);
    }
  }, []);

  const handleRerunCommand = useCallback((_command: string, _arguments_: Record<string, unknown>) => {
    // Switch to executor tab and populate the form
    setActiveTab('executor');
    // The CommandExecutor component would need to expose a method to set command and arguments
    // For now, we'll just switch tabs
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('commandInvocation.title')}</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="executor">{t('commandInvocation.executeCommand')}</TabsTrigger>
          <TabsTrigger value="history">{t('commandInvocation.commandHistory')}</TabsTrigger>
        </TabsList>

        <TabsContent value="executor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('commandInvocation.executeCommand')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CommandExecutor onCommandExecuted={handleCommandExecuted} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('commandInvocation.commandHistory')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CommandHistory onRerunCommand={handleRerunCommand} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
