import { Words } from 'services/backend';

export default class Service {
  static async wordsRequest(level = 0) {
    this.spinnerOn();
    const rndPage = this.randomInteger(0, 59);
    const words = await Words.getWordsForRound(+level - 1, rndPage, 10, [
      'image',
      'audio',
    ]);
    // this.spinnerOff();
    return words;
  }

  static randomInteger(min, max) {
    const rand = min + Math.random() * (max + 1 - min);
    return Math.floor(rand);
  }

  static spinnerOn() {
    const spiner = document.querySelector('.spinner');
    spiner.style.display = 'block';
  }

  static spinnerOff() {
    const spiner = document.querySelector('.spinner');
    const end = 'end';
    spiner.style.display = 'none';
  }
}
