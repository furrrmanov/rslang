import {
  authUser,
  addUser,
  getSettings,
  setSettings,
  setStatistics,
  getUser,
  getStatistics,
} from './dataBackend';

import { APPLICATION } from './config';

let user = null;

const getToday = () => {
  return new Date().getTime() / (3600 * 1000 * 24);
};

const DEFAULT_USER_SETTINGS = {
  newWordsPerDay: 10,
  maxWordsPerDay: 50,
  prompts: {
    translation: true,
    example: true,
    meaning: true,
    transcription: true,
    image: true,
  },
  buttons: {
    showAnswer: true,
    removeWord: true,
    gradeWord: true,
  },
};

const DEFAULT_STATISTICS = {
  wordsLearned: 0,
};

export default class User {
  static getCurrentUser() {
    return user;
  }

  static logout() {
    localStorage.setItem(`${APPLICATION}.auth`, '');
    user = null;
  }

  static login(email, password) {
    return authUser(email, password)
      .then(async (userInfo) => {
        localStorage.setItem(`${APPLICATION}.auth`, JSON.stringify(userInfo));
        await User.fillUser({ ...userInfo, email });
        return user;
      })
      .catch((err) => {
        localStorage.setItem(`${APPLICATION}.auth`, '');
        user = null;
        const msg = 'Вход не удался: ';
        if (err.code) {
          switch (err.code) {
            case 401:
            case 403:
            case 404:
              throw Error(`${msg}неверный логин или пароль`);
            default:
              throw err;
          }
        }
        throw err;
      });
  }

  static autoLogin() {
    let userInfo = localStorage.getItem(`${APPLICATION}.auth`);
    if (!userInfo) throw Error('Нет информации для авто-логина');
    userInfo = JSON.parse(userInfo);
    return getUser(userInfo.userId, userInfo.token).then(async (userData) => {
      await User.fillUser({ ...userInfo, email: userData.email });
      return user;
    });
  }

  static createUserAndLogin(
    email,
    password,
    settings = {
      newWordsPerDay: 10,
      maxWordsPerDay: 50,
      prompts: {
        translation: true,
        meaning: true,
        transcription: true,
        image: true,
      },
      buttons: {
        showAnswer: true,
        removeWord: true,
        gradeWord: true,
      },
    }
  ) {
    return addUser(email, password)
      .then(() => authUser(email, password))
      .then(async (userInfo) => {
        const settingsToUse = { ...DEFAULT_USER_SETTINGS, ...settings };
        await Promise.allSettled([
          setSettings(userInfo.userId, userInfo.token, {
            wordsPerDay: 1,
            optional: {
              user: JSON.stringify(settingsToUse),
            },
          }),
        ]);
        user = { id: userInfo.userId, email, settingsToUse };
        return user;
      })
      .catch((err) => {
        localStorage.setItem(`${APPLICATION}.auth`, '');
        user = null;
        const msg = 'Регистрация не удалась: ';
        if (err.code) {
          switch (err.code) {
            case 417:
              throw Error(`${msg}пользователь уже существует`);
            case 422:
              if (err.body) {
                const { errors } = err.body.error;
                if (errors.find((x) => x.path.includes('email')))
                  throw Error(`${msg}указан невалидный почтовый адрес`);
                else if (errors.find((x) => x.path.includes('password')))
                  throw Error(`${msg}пароль не соответствует требованиям`);
              }
              throw Error(`${msg}ошибка сервера`);
            default:
              throw err;
          }
        }
        throw err;
      });
  }

  static async saveMainStatistics(newStats) {
    let userInfo = localStorage.getItem(`${APPLICATION}.auth`);
    if (!userInfo) throw Error('Пользователь не найден');
    userInfo = JSON.parse(userInfo);
    let stats = {};
    try {
      stats = await getStatistics(userInfo.userId, userInfo.token);
    } catch (err) {
      if (err.code === 404) {
        stats = {
          learnedWords: 0,
          optional: {},
        };
      } else throw err;
    }
    if (!stats.optional.main) {
      stats.optional.main = { d: [] };
    } else {
      stats.optional.main = JSON.parse(stats.optional.main);
    }
    if (!user.stats) user.stats = {};
    Object.assign(user.stats, newStats);

    const today = getToday();
    const foundDate = stats.optional.main.d.find((x) => x.d === today);

    if (!foundDate) stats.optional.main.d.push({ d: today, ...newStats });
    else Object.assign(foundDate, newStats);

    stats.optional.main = JSON.stringify(stats.optional.main);
    delete stats.id;
    return setStatistics(userInfo.userId, userInfo.token, stats);
  }

  static getMainStatistics(isGetAll = false) {
    const today = getToday();
    const defaultValue = [
      {
        d: today,
        ...DEFAULT_STATISTICS,
      },
    ];
    if (isGetAll) {
      return User.getGameStatistics('main', defaultValue);
    }

    return User.getGameStatistics('main', defaultValue).then((mainStat) =>
      mainStat.d ? mainStat.d.find((x) => x.d === today) : {}
    );
  }

  static async saveGameStatistics(game, d, c, t) {
    let userInfo = localStorage.getItem(`${APPLICATION}.auth`);
    if (!userInfo) throw Error('Пользователь не найден');
    userInfo = JSON.parse(userInfo);
    let stats = {};
    try {
      stats = await getStatistics(userInfo.userId, userInfo.token);
    } catch (err) {
      if (err.code === 404) {
        stats = {
          learnedWords: 0,
          optional: {},
        };
      } else throw err;
    }
    if (!stats.optional[game]) {
      stats.optional[game] = { r: [] };
    } else {
      stats.optional[game] = JSON.parse(stats.optional[game]);
    }

    stats.optional[game].r.push({ d, c, t });

    stats.optional[game] = JSON.stringify(stats.optional[game]);
    delete stats.id;
    delete stats.date;
    return setStatistics(userInfo.userId, userInfo.token, stats);
  }

  static getGameStatistics(game, defaultValue = { r: [] }) {
    let userInfo = localStorage.getItem(`${APPLICATION}.auth`);
    if (!userInfo) throw Error('Пользователь не найден');
    userInfo = JSON.parse(userInfo);
    return getStatistics(userInfo.userId, userInfo.token)
      .then((stats) => {
        return stats.optional[game]
          ? JSON.parse(stats.optional[game])
          : defaultValue;
      })
      .catch((err) => {
        if (err.code === 404) {
          return defaultValue;
        }
        throw err;
      });
  }

  static async fillUser(userInfo) {
    try {
      const settings = await getSettings(userInfo.userId, userInfo.token);
      user = {
        id: userInfo.userId,
        email: userInfo.email,
        settings: settings.optional.user
          ? JSON.parse(settings.optional.user)
          : {},
      };
    } catch (err) {
      if (err.code === 404) {
        user = {
          id: userInfo.userId,
          email: userInfo.email,
          settings: { ...DEFAULT_USER_SETTINGS },
        };
      } else {
        localStorage.setItem(`${APPLICATION}.auth`, '');
        user = null;
        throw err;
      }
    }
    try {
      user.stats = await User.getMainStatistics();
    } catch (err) {
      if (err.code === 404) {
        user.stats = { ...DEFAULT_STATISTICS };
      } else {
        localStorage.setItem(`${APPLICATION}.auth`, '');
        user = null;
        throw err;
      }
    }
  }
}
