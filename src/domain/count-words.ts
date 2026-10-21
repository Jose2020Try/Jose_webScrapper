export function countWords(title: string): number {
    return title
      .split(/\s+/u)
      .filter((token) => /[\p{L}\p{N}]/u.test(token))
      .length;
  }