import { Words } from 'services/backend';

export default class Service {
  static async wordsRequest(level) {
    const words = await Words.getWordsForRound(+level - 1, 1, 10, [
      'image',
      'audio',
    ]);

    return words;
  }
}
