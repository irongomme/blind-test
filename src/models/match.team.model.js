import { Model } from '@vuex-orm/core';
import { uid } from 'quasar';
import Match from '@models/match.model';
import Team from '@models/team.model';

export default class MatchTeam extends Model {
  static entity = 'matchTeams'

  static fields() {
    return {
      id: this.uid(() => uid()),
      match_id: this.attr(null),
      team_id: this.attr(null),
      color: this.attr(null),
      score: this.attr(0),
      match: this.belongsTo(Match, 'match_id'),
      team: this.belongsTo(Team, 'team_id'),
    };
  }
}
