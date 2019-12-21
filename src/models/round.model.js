import { Model } from '@vuex-orm/core';
import { uid } from 'quasar';
import Match from '@models/match.model';

export default class Round extends Model {
  static entity = 'rounds';

  static fields() {
    return {
      id: this.uid(() => uid()),
      matchs: this.hasMany(Match, 'round_id'),
    };
  }
}
