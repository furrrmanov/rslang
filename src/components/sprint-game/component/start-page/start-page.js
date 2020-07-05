/* eslint-disable import/no-cycle */
/* eslint-disable class-methods-use-this */
import store from 'components/sprint-game/component/storage';
import Timer from 'components/sprint-game/component/timer/timer';
import 'stylesheets/sprint-game/sprint-game.scss';
import Service from 'components/sprint-game/component/service';
import Toaster from 'components/Toaster/index';

export default class StartPage {
  static render(container) {
    const intro = document.createElement('div');
    intro.classList.add('intro');
    intro.innerHTML = `
     <div class="title">
       <span>Sprint</span>
     </div>
     <div class="subTitle">
       <span>Игра Sprint развивает словарный запас и скорость принятия решений.
       Чем больше слов ты знаешь и чем быстрее принимаешь решение, тем больше очков опыта получишь.</span>
     </div>
     <span class="level-select">Выберите уровень</span>
     <div class="level-block">
        <button data-num="0" type="button" class="btn btn-primary start">1</button>
        <button data-num="1" type="button" class="btn btn-primary start">2</button>
        <button data-num="2" type="button" class="btn btn-primary start">3</button>
        <button data-num="3" type="button" class="btn btn-primary start">4</button>
        <button data-num="4" type="button" class="btn btn-primary start">5</button>
        <button data-num="5" type="button" class="btn btn-primary start">6</button>
        <button data-num="-1" type="button" class="btn btn-primary start learn-words">Изучаемые слова</button>
     </div>
    `;

    container.append(intro);
    document.querySelectorAll('.start').forEach((item) => {
      item.addEventListener('click', async () => {
        Service.spinnerOn();
        const words = await Service.wordsRequest(+item.dataset.num);
        store.setState({ requestWords: words });
        store.setState({ groupe: +item.dataset.num });
        store.setState({ round: 0 });
        store.setState({ correctChoice: 0 });
        store.setState({ points: 0 });

        if (words.length < 50) {
          Toaster.createToast(
            'Недостаточно слов для игры (необходимо минимум 50 слов)',
            'danger'
          );
          Service.spinnerOff();
        } else {
          intro.remove();
          Service.spinnerOff();
          Timer.init();
        }
      });
    });
  }

  static init(container) {
    this.render(container);
  }
}
