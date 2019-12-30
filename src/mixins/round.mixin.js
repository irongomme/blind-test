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
        // Scores aléatoires pour tester
        randomScores: false,
        // Surcharge des valeurs
        ...optionsObject,
      };

      // Nouveau round
      const newRound = new Round();
      const matchs = [];
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

      // Découpage par match des équipes mélangées au hasard
      const matchsTeams = _.chunk(
        _.shuffle(teams),
        this.game.numberOfTeamsPerMatch,
      );
      // Création des matchs
      matchsTeams.forEach((matchTeams) => {
        // Nouveau match
        const newMatch = new Match();
        // Pour chaque équipe dans ce match
        matchTeams.forEach((team, teamIndex) => {
          // Gestion du score initial
          const emptyScore = options.randomScores ? Math.floor(Math.random() * 10) : 0;
          const initialScore = options.cumulativeScores === true
            // Gestion du cumul des scores
            ? MatchTeam.query().where('team_id', team.id).last().score
            // Score initial à zéro
            : emptyScore;

          // Création de la relation match - équipe
          MatchTeam.insert({
            data: {
              match_id: newMatch.id,
              team_id: team.id,
              color: this.matchColors[teamIndex],
              score: initialScore,
            },
          });
        });

        matchs.push({
          id: newMatch.id,
          round_id: newRound.id,
          is_final: this.game.numberOfTeamsPerMatch === teams.length,
          teams: matchTeams,
        });
      });

      // Enfin, insertion de nouveau round
      Round.insert({ data: { id: newRound.id } });
      // Insertion des nouveaux matchs
      Match.insert({ data: matchs }).then(() => {
        // Redirection vers la nouvelle manche
        this.$router.push({
          path: `/manches/${newRound.id}`,
        });
      });
    },
    newSeparationMatch(roundId, matchTeams) {
      const matchs = [];
      let teamsPerMatch = this.game.numberOfTeamsPerMatch;
      // On verifie qu'un match ne va pas se retrouver avec une seule équipe
      if (matchTeams.length % this.game.numberOfTeamsPerMatch === 1) {
        teamsPerMatch -= 1;
      }
      // Découpage par match des équipes mélangées au hasard
      const matchsTeams = _.chunk(_.shuffle(matchTeams), teamsPerMatch);
      // Création des matchs
      matchsTeams.forEach((matchTeamSet) => {
        const newMatch = new Match();
        // Pour chaque pool d'équipes
        matchTeamSet.forEach((matchTeamItem, matchTeamIndex) => {
          // Création de la nouvelle relation
          MatchTeam.insert({
            data: {
              match_id: newMatch.id,
              team_id: matchTeamItem.team.id,
              color: this.matchColors[matchTeamIndex],
              score: matchTeamItem.score,
            },
          });
          // Suppression de l'ancienne
          MatchTeam.delete(matchTeamItem.id);
        });

        matchs.push({
          id: newMatch.id,
          round_id: roundId,
          teams: matchTeams.map(matchTeam => matchTeam.team),
        });
      });

      // Insertion des nouveau matchs
      return Match.insert({ data: matchs });
    },
  },
  computed: {
    game: () => Game.query().first() || false,
    roundsCount: () => Round.query().count() || 0,
  },
};
