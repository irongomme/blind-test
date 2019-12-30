import _ from 'lodash';
import Game from '@models/game.model';
import RoundMixin from '@mixins/round.mixin';
import Round from '@models/round.model';
import MatchTeam from '@models/match.team.model';

export default {
  name: 'DialogRoundSummary',
  mixins: [RoundMixin],
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    roundId: {
      type: String,
      required: true,
    },
    teamsRanking: Array,
  },
  data() {
    return {
      listItemHeight: 64,
      cumulativeScores: true,
      keepTeamsQuantity: this.teamsRanking.length,
    };
  },
  methods: {
    processSeparation() {
      let waiversTeams = [];

      // Score le plus bas des equipes qualifiees
      const leastScore = Math.min(
        ...this.qualifiedMatchTeams.map(matchTeam => matchTeam.score),
      );
      // Equipes a ne pas disqualifier tout de suite
      const unqualifiedWaiversTeams = this.unqualifiedMatchTeams
        .filter(matchTeam => matchTeam.score === leastScore);

      // Si des equipes doivent se trouver en ballotage
      if (unqualifiedWaiversTeams.length > 0) {
        // On extrait toutes les équipes à départager
        waiversTeams = this.teamsRanking
          .filter(matchTeam => matchTeam.score === leastScore);
        // On les insere dans la liste des equipes toujours qualifiees
        unqualifiedWaiversTeams
          .forEach(matchTeam => this.qualifiedMatchTeams.push(matchTeam));
      }

      // Si le nombre d'équipe nécessaire pour la finale est atteint
      if (this.qualifiedMatchTeams.length === this.game.numberOfTeamsPerMatch) {
        this.cumulativeScores = false;
      }

      // On met à jour toutes les entrées match-equipe
      this.teamsRanking.forEach(matchTeam => MatchTeam.update({
        where: matchTeam.id,
        data: {
          is_disqualified: (
            _.indexOf(this.qualifiedMatchTeams.map(item => item.id), matchTeam.id) === -1
          ),
          need_separation: (
            _.indexOf(waiversTeams.map(item => item.id), matchTeam.id) !== -1
          ),
        },
      }));
    },
    sendSeparationMatch() {
      const matchTeamsToSeparate = MatchTeam.query()
        .where('need_separation', true)
        .with('team')
        .with('match')
        .whereHas('match', (query) => {
          query.where('round_id', this.roundId);
        })
        .all();

      this.newSeparationMatch(this.roundId, matchTeamsToSeparate)
        .then(() => {
          this.$emit('newMatch');
        });
    },
  },
  computed: {
    game: () => Game.query().first() || false,
    opened: {
      get() {
        return this.value;
      },
      set(value) {
        this.$emit('input', value);
      },
    },
    bestScore() {
      const scores = this.teamsRanking.map(matchTeam => matchTeam.score);
      return Math.max(...scores);
    },
    keepTeamsQuantityOptions() {
      return Array
        .from(Array(this.teamsRanking.length).keys())
        .map(number => number + 1);
    },
    lastRoundId() {
      const lastRound = Round.query().last();
      return lastRound.id;
    },
    needSeparation() {
      const reducer = (compute, value) => compute + (value.need_separation ? 1 : 0);
      return this.teamsRanking.reduce(reducer, 0) > 0;
    },
    qualifiedMatchTeams() {
      return this.teamsRanking
        .filter((matchTeam, index) => index < this.keepTeamsQuantity);
    },
    unqualifiedMatchTeams() {
      return this.teamsRanking
        .filter((matchTeam, index) => index >= this.keepTeamsQuantity);
    },
    isFinale() {
      return this.qualifiedMatchTeams.length === this.game.numberOfTeamsPerMatch;
    },
  },
};
