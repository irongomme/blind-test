import { Model } from '@vuex-orm/core';
import { uid } from 'quasar';

export default class Match extends Model {
  static entity = 'matchs';

  static fields() {
    return {
      id: this.uid(() => uid()),
      round_id: this.attr(null),
      is_closed: this.attr(false),
    };
  }
}
