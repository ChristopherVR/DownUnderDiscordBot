import { useEffect, useState } from 'react';
import { Api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useErrorHandling } from '@/hooks/useErrorHandling';
import { ErrorDisplay } from '@/components/ui/error-display';
import { useTranslation } from 'react-i18next';
import type { CommandDefinition, CommandOption, CommandChoice } from 'discord-dashboard-shared';

export default function SlashCommands() {
  const { t } = useTranslation();
  const { error, handleError, clearError } = useErrorHandling({
    component: 'SlashCommands',
  });
  const [list, setList] = useState<CommandDefinition[]>([]);
  const [cmd, setCmd] = useState<CommandDefinition | null>(null);
  const [args, setArgs] = useState<Record<string, unknown>>({});
  const [resp, setResp] = useState<string>('');

  useEffect(() => {
    Api.getCommandRegistry().then((response) => setList(response.commands));
  }, []);
  useEffect(() => {
    setArgs({});
  }, [cmd?.name]);

  const options = cmd?.options ?? [];

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Error Display */}
        {error && (
          <ErrorDisplay
            error={error}
            onDismiss={clearError}
            variant="inline"
            context={{ component: 'SlashCommands' }}
          />
        )}

        <div className="grid md:grid-cols-3 gap-3">
          <div className="md:col-span-1">
            <Label className="text-xs">Command</Label>
            <Select onValueChange={(v) => setCmd(list.find((x) => x.name === v) || null)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a command" />
              </SelectTrigger>
              <SelectContent>
                {list.map((c) => (
                  <SelectItem key={c.name} value={c.name}>
                    /{c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {cmd && <div className="text-xs text-muted-foreground mt-1">{cmd.description}</div>}
          </div>
          <div className="md:col-span-2 grid gap-3">
            {options.map((option: CommandOption) => (
              <div key={option.name} className="grid gap-1.5">
                <Label className="text-xs">
                  {option.name} {option.required ? <span className="text-red-500">*</span> : null}
                </Label>
                {option.type === 'string' && !option.choices && (
                  <Input
                    placeholder={option.description}
                    value={args[option.name] ?? ''}
                    onChange={(e) => setArgs({ ...args, [option.name]: e.target.value })}
                  />
                )}
                {option.type === 'integer' && (
                  <Input
                    type="number"
                    placeholder={option.description}
                    value={args[option.name] ?? ''}
                    onChange={(e) => setArgs({ ...args, [option.name]: Number(e.target.value) })}
                  />
                )}
                {option.type === 'boolean' && (
                  <Select
                    value={String(args[option.name] ?? '')}
                    onValueChange={(v) => setArgs({ ...args, [option.name]: v === 'true' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select true/false" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">true</SelectItem>
                      <SelectItem value="false">false</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {option.type === 'string' && option.choices && (
                  <Select onValueChange={(v) => setArgs({ ...args, [option.name]: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder={option.description} />
                    </SelectTrigger>
                    <SelectContent>
                      {option.choices.map((choice: CommandChoice) => (
                        <SelectItem key={choice.value} value={String(choice.value)}>
                          {choice.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <div className="text-[10px] text-muted-foreground">{option.description}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            disabled={!cmd}
            onClick={async () => {
              try {
                clearError();
                const r = await Api.executeSlash(cmd!.name, args);
                setResp(JSON.stringify(r, null, 2));
              } catch (e: unknown) {
                handleError(e, { action: 'executeCommand' });
                setResp(t('errors.command.failed', 'Command execution failed'));
              }
            }}
          >
            Run
          </Button>
          {cmd && (
            <div className="text-xs text-muted-foreground">
              /{cmd.name}{' '}
              {Object.keys(args)
                .map((k) => `${k}:${String(args[k])}`)
                .join(' ')}
            </div>
          )}
        </div>
        {resp && <pre className="bg-muted rounded p-3 text-xs overflow-auto max-h-64">{resp}</pre>}
      </CardContent>
    </Card>
  );
}
