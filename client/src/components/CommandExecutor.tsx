import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Api } from '@/lib/api';
import { useCommandSync } from '@/hooks/useCommandSync';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Play, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react';
import { CommandDefinition, CommandOption, CommandExecution } from 'discord-dashboard-shared';
import { useErrorHandling } from '@/hooks/useErrorHandling';
import { ErrorDisplay } from '@/components/ui/error-display';

interface CommandExecutorProps {
  onCommandExecuted?: (execution: CommandExecution) => void;
}

export function CommandExecutor({ onCommandExecuted }: CommandExecutorProps) {
  const { t } = useTranslation();
  const { addCommandExecution, getLatestExecution } = useCommandSync();
  const { error, isRetrying, retry, clearError, withErrorHandling } = useErrorHandling({
    component: 'CommandExecutor',
  });
  const [commands, setCommands] = useState<CommandDefinition[]>([]);
  const [selectedCommand, setSelectedCommand] = useState<CommandDefinition | null>(null);
  const [arguments_, setArguments] = useState<Record<string, unknown>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<CommandExecution | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);
  const didLoadCommands = useRef(false);

  // Load available commands
  useEffect(() => {
    if (didLoadCommands.current) {
      return;
    }
    didLoadCommands.current = true;

    const loadCommands = async () => {
      setIsLoading(true);
      const response = await withErrorHandling(
        async () => {
          return await Api.getCommandRegistry();
        },
        { action: 'loadCommands' },
      );

      if (response) {
        setCommands(response.commands || []);
      }
      setIsLoading(false);
    };

    loadCommands();
  }, [withErrorHandling]);

  // Reset arguments when command changes
  useEffect(() => {
    setArguments({});
    setValidationErrors({});
    setExecutionResult(null);
  }, [selectedCommand]);

  // Validate arguments in real-time
  useEffect(() => {
    if (!selectedCommand) return;

    const errors: Record<string, string> = {};

    selectedCommand.options?.forEach((option) => {
      const value = arguments_[option.name];

      // Check required fields
      if (option.required && (value === undefined || value === null || value === '')) {
        errors[option.name] = t('commandInvocation.form.required');
        return;
      }

      // Skip validation for empty optional fields
      if (!option.required && (value === undefined || value === null || value === '')) {
        return;
      }

      // Type validation
      switch (option.type) {
        case 'integer':
          if (isNaN(Number(value)) || !Number.isInteger(Number(value))) {
            errors[option.name] = t('commands.validation.invalidType');
          } else {
            const numValue = Number(value);
            if (option.min !== undefined && numValue < option.min) {
              errors[option.name] = t('commands.validation.outOfRange');
            }
            if (option.max !== undefined && numValue > option.max) {
              errors[option.name] = t('commands.validation.outOfRange');
            }
          }
          break;
        case 'string':
          if (option.choices && !option.choices.some((choice) => choice.value === value)) {
            errors[option.name] = t('commands.validation.invalidChoice');
          }
          break;
      }
    });

    setValidationErrors(errors);
  }, [arguments_, selectedCommand, t]);

  const handleArgumentChange = (optionName: string, value: unknown) => {
    setArguments((prev) => ({
      ...prev,
      [optionName]: value,
    }));
  };

  const handleExecuteCommand = async () => {
    if (!selectedCommand || Object.keys(validationErrors).length > 0) return;

    setIsExecuting(true);
    setExecutionResult(null);
    setCurrentExecutionId(null);

    const response = await withErrorHandling(
      async () => {
        return await Api.executeSlash(selectedCommand.name, arguments_);
      },
      { action: 'executeCommand', metadata: { command: selectedCommand.name } },
    );

    if (response) {
      if (response.success && response.execution) {
        setExecutionResult(response.execution);
        setCurrentExecutionId(response.execution.id);
        addCommandExecution(response.execution);
        onCommandExecuted?.(response.execution);
      } else {
        // Handle API error response
        const errorExecution: CommandExecution = {
          id: Date.now().toString(),
          command: selectedCommand.name,
          arguments: arguments_,
          timestamp: Date.now(),
          status: 'error',
          error: response.error || t('errors.command.failed'),
        };
        setExecutionResult(errorExecution);
        addCommandExecution(errorExecution);
      }
    }
    setIsExecuting(false);
  };

  // Listen for real-time updates to the current execution
  useEffect(() => {
    if (currentExecutionId) {
      const updatedExecution = getLatestExecution(currentExecutionId);
      if (updatedExecution && updatedExecution !== executionResult) {
        setExecutionResult(updatedExecution);
        if (updatedExecution.status !== 'pending') {
          setIsExecuting(false);
        }
      }
    }
  }, [currentExecutionId, getLatestExecution, executionResult]);

  const handleClearForm = () => {
    setArguments({});
    setValidationErrors({});
    setExecutionResult(null);
  };

  const renderArgumentInput = (option: CommandOption) => {
    const value = arguments_[option.name];
    const hasError = validationErrors[option.name];

    const baseProps = {
      id: option.name,
      'aria-describedby': hasError ? `${option.name}-error` : undefined,
      className: hasError ? 'border-red-500' : undefined,
    };

    switch (option.type) {
      case 'string':
        if (option.choices) {
          return (
            <Select value={value || ''} onValueChange={(newValue) => handleArgumentChange(option.name, newValue)}>
              <SelectTrigger {...baseProps}>
                <SelectValue placeholder={t('commandInvocation.form.placeholder', { field: option.name })} />
              </SelectTrigger>
              <SelectContent>
                {option.choices.map((choice) => (
                  <SelectItem key={choice.value} value={String(choice.value)}>
                    {choice.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }
        return (
          <Input
            {...baseProps}
            type="text"
            value={value || ''}
            onChange={(e) => handleArgumentChange(option.name, e.target.value)}
            placeholder={t('commandInvocation.form.placeholder', { field: option.name })}
          />
        );

      case 'integer':
        return (
          <Input
            {...baseProps}
            type="number"
            value={value || ''}
            onChange={(e) => handleArgumentChange(option.name, Number(e.target.value))}
            placeholder={t('commandInvocation.form.placeholder', { field: option.name })}
            min={option.min}
            max={option.max}
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={option.name}
              checked={Boolean(value)}
              onCheckedChange={(checked) => handleArgumentChange(option.name, checked)}
            />
            <Label htmlFor={option.name} className="text-sm">
              {value ? 'True' : 'False'}
            </Label>
          </div>
        );

      case 'file':
        return (
          <Input
            {...baseProps}
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleArgumentChange(option.name, file);
              }
            }}
            accept="audio/*"
          />
        );

      default:
        return (
          <Textarea
            {...baseProps}
            value={value || ''}
            onChange={(e) => handleArgumentChange(option.name, e.target.value)}
            placeholder={t('commandInvocation.form.placeholder', { field: option.name })}
            rows={3}
          />
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">{t('common.loading')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <ErrorDisplay
          error={error}
          onRetry={() => retry()}
          onDismiss={clearError}
          isRetrying={isRetrying}
          variant="inline"
          context={{ component: 'CommandExecutor' }}
        />
      )}

      {/* Command Selection */}
      <div className="space-y-2">
        <Label htmlFor="command-select">{t('commandInvocation.form.selectCommand')}</Label>
        <Select
          value={selectedCommand?.name || ''}
          onValueChange={(commandName) => {
            const command = commands.find((cmd) => cmd.name === commandName);
            setSelectedCommand(command || null);
          }}
        >
          <SelectTrigger id="command-select">
            <SelectValue placeholder={t('commandInvocation.form.selectCommand')} />
          </SelectTrigger>
          <SelectContent>
            {commands.map((command) => (
              <SelectItem key={command.name} value={command.name}>
                <div className="flex items-center space-x-2">
                  <span>/{command.name}</span>
                  {command.category && (
                    <Badge variant="secondary" className="text-xs">
                      {t(`commands.categories.${command.category}`, command.category)}
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedCommand && <p className="text-sm text-muted-foreground">{selectedCommand.description}</p>}
      </div>

      {/* Command Arguments */}
      {selectedCommand && selectedCommand.options && selectedCommand.options.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('commandInvocation.arguments')}</h3>
              <div className="grid gap-4">
                {selectedCommand.options.map((option) => (
                  <div key={option.name} className="space-y-2">
                    <Label htmlFor={option.name} className="flex items-center space-x-2">
                      <span>{option.name}</span>
                      {option.required ? (
                        <Badge variant="destructive" className="text-xs">
                          {t('commandInvocation.form.required')}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          {t('commandInvocation.form.optional')}
                        </Badge>
                      )}
                    </Label>
                    {renderArgumentInput(option)}
                    {option.description && <p className="text-xs text-muted-foreground">{option.description}</p>}
                    {validationErrors[option.name] && (
                      <p id={`${option.name}-error`} className="text-xs text-red-500">
                        {validationErrors[option.name]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {selectedCommand && (
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleExecuteCommand}
            disabled={!selectedCommand || Object.keys(validationErrors).length > 0 || isExecuting}
            className="flex items-center space-x-2"
          >
            {isExecuting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            <span>{isExecuting ? t('commandInvocation.form.executing') : t('commandInvocation.form.execute')}</span>
          </Button>
          <Button variant="outline" onClick={handleClearForm}>
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('commandInvocation.form.clear')}
          </Button>
        </div>
      )}

      {/* Execution Result */}
      {executionResult && (
        <Alert className={executionResult.status === 'success' ? 'border-green-500' : 'border-red-500'}>
          <div className="flex items-center space-x-2">
            {executionResult.status === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            <span className="font-semibold">{t(`commandInvocation.status.${executionResult.status}`)}</span>
          </div>
          <AlertDescription className="mt-2">
            {executionResult.status === 'success' ? (
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Command executed successfully at {new Date(executionResult.timestamp).toLocaleString()}
                </p>
                {executionResult.result && (
                  <pre className="bg-muted rounded p-2 text-xs overflow-auto max-h-32">
                    {typeof executionResult.result === 'string'
                      ? executionResult.result
                      : JSON.stringify(executionResult.result, null, 2)}
                  </pre>
                )}
              </div>
            ) : (
              <div>
                <p className="text-sm text-red-600 mb-2">{executionResult.error || t('errors.command.failed')}</p>
                <p className="text-xs text-muted-foreground">
                  Failed at {new Date(executionResult.timestamp).toLocaleString()}
                </p>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
