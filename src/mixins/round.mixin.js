import _ from 'lodash';
import Game from '@models/game.model';
import Match from '@models/match.model';
import MatchTeam from '@models/match.team.model';
import Team from '@models/team.model';
import Round from '@models/round.model';

export default {
  data() {
    return {
      matchColors: [
        'blue-9',
        'yellow-8',
        'green',
        'red-9',
      ],
    };
  },
  methods: {
    newRound() {
      // Ids de toutes les équipes
      const teams = Team.query()
        .where('is_active', true)
        .with('players')
        .with('teamMatchs')
        .all();
      const allTeams = _.shuffle(teams);
      // Valeurs max des incréments
      const matchCount = allTeams.length / this.game.numberOfTeamsPerMatch;
      const matchTeamsCount = this.game.numberOfTeamsPerMatch;
      // Nouveau round
      const newRound = new Round();

      // Pour chaque match on va attribuer x équipes
      for (let matchInc = 0; matchInc < matchCount; matchInc += 1) {
        // Préparation du tableau d'équipes pour le nouveau match
        const newMatch = new Match();
        const matchTeams = [];
        // Découpage des x équipes
        for (let teamInc = 0; teamInc < matchTeamsCount; teamInc += 1) {
          const currentTeam = allTeams[teamInc + matchInc * matchTeamsCount];
          // Fabrication du pool de x équipes dans ce match
          matchTeams.push(currentTeam);
          // Création de la relation
          MatchTeam.insert({
            data: {
              match_id: newMatch.id,
              team_id: currentTeam.id,
              color: this.matchColors[teamInc],
              // Temporaire
              score: Math.floor(Math.random() * 10),
            },
          });
        }

        // Insertion du nouveau match
        Match.insert({
          data: {
            id: newMatch.id,
            round_id: newRound.id,
            teams: matchTeams,
          },
        });
      }

      // Enfin, insertion de nouveau round
      Round.insert({
        data: {
          id: newRound.id,
        },
      }).then(() => {
        // Redirection vers la nouvelle manche
        this.$router.push({
          path: `/manches/${newRound.id}`,
        });
      });
    },
  },
  computed: {
    game: () => Game.query().first() || false,
  },
};
