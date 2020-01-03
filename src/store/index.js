import Vue from 'vue';
import Vuex from 'vuex';
import VuexORM from '@vuex-orm/core';
import VuexPersistence from 'vuex-persist';
// Modèles
import Game from '../models/game.model';
import Match from '../models/match.model';
import MatchHistory from '../models/match_history.model';
import MatchTeam from '../models/match.team.model';
import Player from '../models/player.model';
import Round from '../models/round.model';
import Team from '../models/team.model';

// import example from './module-example'

Vue.use(Vuex);

// Create a new instance of Database.
const database = new VuexORM.Database();

// Register Models to Database.
database.register(Game);
database.register(Match);
database.register(MatchHistory);
database.register(MatchTeam);
database.register(Player);
database.register(Round);
database.register(Team);

// Persistence
const vuexLocal = new VuexPersistence({
  storage: window.localStorage,
});

/*
 * If not building with SSR mode, you can
 * directly export the Store instantiation
 */

export default function (/* { ssrContext } */) {
  const Store = new Vuex.Store({
    modules: {
      // example
    },
    plugins: [
      VuexORM.install(database),
      vuexLocal.plugin,
    ],

    // enable strict mode (adds overhead!)
    // for dev mode only
    strict: process.env.DEV,
  });

  return Store;
}
