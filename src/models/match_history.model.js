import { Model } from '@vuex-orm/core';
import { uid } from 'quasar';
import MatchTeam from '@models/match.team.model';

export default class MatchHistory extends Model {
  static entity = 'matchHistories';

  static fields() {
    return {
      id: this.uid(() => uid()),
      matchTeam_id: this.attr(null),
      is_playing: this.attr(false),
      is_success: this.attr(false),
      is_cancelled: this.attr(false),
      matchTeam: this.belongsTo(MatchTeam, 'matchTeam_id'),
    };
  }
}
