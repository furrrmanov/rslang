/* eslint-disable import/no-cycle */
import Service from 'components/games-englishPuzzle/app/service';
import store from 'components/games-englishPuzzle/app/storage';
import Header from 'components/games-englishPuzzle/app/components/main/header/header';
import ResultsBlock from 'components/games-englishPuzzle/app/components/main/results-block/results-block';
import SourceData from 'components/games-englishPuzzle/app/components/main/source-data/source-data';
import Button from 'components/games-englishPuzzle/app/components/main/button/button';
import Hints from 'components/games-englishPuzzle/app/components/main/header/hints/hints';
import Toaster from 'components/Toaster';
import Statisctic from 'components/games-englishPuzzle/app/components/main/statistic/statistic';

export default class StartPage {
  static render(container) {
    const intro = document.createElement('div');
    intro.classList.add('intro');
    intro.innerHTML = `
    <div class="intro-placeholder">
     <div class="title">
         <span>English-puzzle</span>
     </div>
     <div class="subTitle">
         <span>Тренировка English-puzzle развивает словарный запас.
         Чем больше слов ты знаешь, тем больше очков опыта получишь.</span>
     </div>
     <span class="level-select">Выберите уровень</span>
     <div class="level-block">
         <button data-num="0" type="button" class="btn btn-primary start">1</button>
         <button data-num="1" type="button" class="btn btn-primary start">2</button>
         <button data-num="2" type="button" class="btn btn-primary start">3</button>
         <button data-num="3" type="button" class="btn btn-primary start">4</button>
         <button data-num="4" type="button" class="btn btn-primary start">5</button>
         <button data-num="5" type="button" class="btn btn-primary start">6</button>
     </div>
     </div>
    `;
    container.append(intro);

    const userDisplay = window.innerWidth;

    document.querySelectorAll('.start').forEach((item) => {
      item.addEventListener('click', async () => {
        try {
          const words = await Service.wordRequest(+item.dataset.num);
          store.setState({ requestWords: words });
          store.setState({ groupe: item.dataset.num });
          store.setState({ solution: 'yes' });
          store.setState({ level: +item.dataset.num });
          store.setState({ correctChoice: 9 });
          store.setState({ appendCard: '' });
          store.setState({ autoPlay: 'yes' });
          store.setState({ background: 'none' });
          store.setState({ wordsCount: 0 });

          if (words.length < 10) {
            Toaster.createToast(
              'Недостаточно слов для игры (необходимо минимум 10 слов)',
              'danger'
            );
            Service.spinnerOff();
          }

          if (words.length >= 10 && userDisplay > 768) {
            intro.remove();
            Header.init();
            ResultsBlock.init();
            SourceData.init();
            Button.init();
            Service.puzzleDrop();
            Service.hintsClick();
            Hints.btnTranslate();
            Statisctic.rebootStatictic();
          } else {
            Toaster.createToast(
              'разрешение вашего экрана не поддерживается',
              'danger'
            );
            Service.spinnerOff();
          }
        } catch (error) {
          if (error.message.search('fetch') > -1) {
            Toaster.createToast('отсутсвует соединение с интернетом', 'danger');
          } else {
            Toaster.createToast('необходимо авторизоваться', 'danger');
          }
        }
      });
    });
  }

  static init(container) {
    this.render(container);
  }
}
