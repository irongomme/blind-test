import { Model } from '@vuex-orm/core';
import { uid } from 'quasar';
import Player from '@models/player.model';

export default class Team extends Model {
  static entity = 'teams';

  static fields() {
    return {
      id: this.uid(() => uid()),
      name: this.attr(''),
      avatar: this.attr(''),
      players: this.hasMany(Player, 'team_id'),
    };
  }
}
