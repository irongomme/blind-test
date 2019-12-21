import { Model } from '@vuex-orm/core';

export default class Game extends Model {
  static entity = 'games';

  static fields() {
    return {
      numberOfTeams: this.attr(16),
      numberOfTeamsPerMatch: this.attr(4),
      minTeamSize: this.attr(2),
      maxTeamSize: this.attr(4),
      maxRounds: this.attr(4),
      isOpened: this.attr(true),
    };
  }
}
