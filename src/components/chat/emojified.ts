export const emojiRegExp = /(?<!\w)(:[OD)(/\\]:?)|(:[\w\d]+:)/gi;

const textToEmoji: any = {
  ':)': '🙂',
  ':D': '😀',
  ':(': '🙁',
  ':\\': '😕',
  ':/': '😕',
  ':O': '😮',
  ':robot:': '🤖',
  ':cat:': '😺',
  ':pussy:': '😺',
  ':@': '😠',
  ':angry:': '😠',
  ':go_game:': '🎮',
};

export function emojiMatchReplace(match: string) {
  return textToEmoji[match.trim()] ?? match;
}
