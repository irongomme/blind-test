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
    newRound(optionsObject = {}) {
      const options = {
        // Cumul des score du round précédent
        cumulativeScores: false,
        // Surcharge des valeurs
        ...optionsObject,
      };

      // Nouveau round
      const newRound = new Round();
      // equipes
      let teams = [];
      // Lecture de tous les rounds
      const allRounds = Round.query().all();

      // Si aucun round n'existe
      if (allRounds.length === 0) {
        // selection de toutes les équipes
        teams = Team.query().with('players').all();
      } else {
        // selection des équipes non disqualifiés lors du round précédent
        const lastRoundId = allRounds[allRounds.length - 1].id;
        const lastMatchTeams = MatchTeam.query()
          .with('team')
          .with('match')
          .where('is_disqualified', false)
          .whereHas('match', (query) => {
            query.where('round_id', lastRoundId);
          })
          .all();

        teams = lastMatchTeams.map(matchTeam => matchTeam.team);
      }

      // Melange des equipes
      const allTeams = _.shuffle(teams);
      // Valeurs max des incréments
      const matchCount = Math.ceil(allTeams.length / this.game.numberOfTeamsPerMatch);
      const matchTeamsCount = this.game.numberOfTeamsPerMatch;

      // Pour chaque match on va attribuer x équipes
      for (let matchInc = 0; matchInc < matchCount; matchInc += 1) {
        // Préparation du tableau d'équipes pour le nouveau match
        const newMatch = new Match();
        const matchTeams = [];
        // Découpage des x équipes
        for (let teamInc = 0; teamInc < matchTeamsCount; teamInc += 1) {
          const currentTeam = allTeams[teamInc + matchInc * matchTeamsCount];
          let initialScore;
          // Fabrication du pool de x équipes dans ce match
          matchTeams.push(currentTeam);
          // Gestion du cumul des scores
          if (options.cumulativeScores === true) {
            const lastMatchTeam = MatchTeam.query()
              .where('team_id', currentTeam.id)
              .last();
            initialScore = lastMatchTeam.score;
          } else {
            initialScore = 0;
            // initialScore = Math.floor(Math.random() * 10);
          }
          // Création de la relation
          MatchTeam.insert({
            data: {
              match_id: newMatch.id,
              team_id: currentTeam.id,
              color: this.matchColors[teamInc],
              // Temporaire
              score: initialScore,
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
    newSeparationMatch(roundId, matchTeams) {
      const newMatch = new Match();
      // Découpage des x équipes
      for (let matchTeamInc = 0; matchTeamInc < matchTeams.length; matchTeamInc += 1) {
        // Création de la nouvelle relation
        MatchTeam.insert({
          data: {
            match_id: newMatch.id,
            team_id: matchTeams[matchTeamInc].team.id,
            color: this.matchColors[matchTeamInc],
            score: matchTeams[matchTeamInc].score,
          },
        });
        // Suppression de l'ancienne
        MatchTeam.delete(matchTeams[matchTeamInc].id);
      }

      // Insertion du nouveau match
      return Match.insert({
        data: {
          id: newMatch.id,
          round_id: roundId,
          teams: matchTeams.map(matchTeam => matchTeam.team),
        },
      });
    },
  },
  computed: {
    game: () => Game.query().first() || false,
  },
};
