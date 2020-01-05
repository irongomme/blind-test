import Game from '@models/game.model';
import MatchHistory from '@models/match_history.model';
import { global } from '@utils/global.js';

export default {
  name: 'TeamListCard',
  props: {
    match: Object,
    star: Boolean,
    isLastScored: Boolean,
    color: {
      type: String,
      default: 'indigo',
    },
    playingTeam: {
      type: Object,
      default: { is_playing: false },
    },
  },
  data() {
    return {
      countdown: 10,
      timer: false,
      global,
    };
  },
  methods: {
    focus() {
      // Empécher la double action
      if (this.playingTeam.is_playing || Number(this.match.team.rank) > 0) {
        return;
      }

      // Nouvelle participation
      MatchHistory.insert({
        data: {
          matchTeam_id: this.match.id,
          is_playing: true,
        },
      }).then(() => {
        // Initialisation du temps restant
        const tick = 100; // Millisecondes
        const tickIncrement = (1 / tick) / (Number(this.game.answerTimerDuration) / 100);
        // Lancement du compte à rebours
        this.timer = setInterval(() => {
          this.countdown -= tickIncrement;

          if (this.countdown <= 0) {
            // On stop tout, le point est perdu
            this.triggerFailure();
          }
        }, tick);
      });
    },
    triggerSuccess() {
      this.$emit('success');
      this.stopCountdown();
    },
    triggerFailure() {
      this.$emit('failure');
      this.stopCountdown();
    },
    stopCountdown() {
      // Arrêt du timer
      clearInterval(this.timer);
      // Remise à zéro du compteur de progression de la barre de chargement
      this.countdown = 10;
    },
  },
  computed: {
    game: () => Game.query().first() || false,
    isPlaying() {
      return this.playingTeam.is_playing
        && this.playingTeam.matchTeam.team_id === this.match.team_id;
    },
    isFinalWon() {
      return Number(this.match.team.rank) > 0;
    },
    isMatchClosed() {
      return this.match.match.is_closed || this.isFinalWon;
    },
  },
};
