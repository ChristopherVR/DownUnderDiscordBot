const isGenerated = (file) => file.includes('/database/generated/') || file.includes('\\database\\generated\\');

export default {
  '*.{ts,tsx}': (filenames) => {
    const lintable = filenames.filter((f) => !isGenerated(f));
    const commands = [];
    if (lintable.length > 0) commands.push(`oxlint --deny-warnings ${lintable.join(' ')}`);
    commands.push(`oxfmt --check ${filenames.join(' ')}`);
    return commands;
  },
  '*.{js,jsx,json,md}': (filenames) => [`oxfmt --check ${filenames.join(' ')}`],
};
