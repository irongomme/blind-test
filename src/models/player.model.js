import { Model } from '@vuex-orm/core';
import { uid } from 'quasar';

export default class Player extends Model {
  static entity = 'players';

  static fields() {
    return {
      id: this.uid(() => uid()),
      team_id: this.attr(null),
      name: this.attr(''),
    };
  }
}
