import RoundMixin from '@mixins/round.mixin';
import TeamMixin from '@mixins/team.mixin';
import Game from '@models/game.model';
import Round from '@models/round.model';
import EventBus from '@store/event-bus';

export default {
  name: 'DefaultLayout',
  mixins: [RoundMixin, TeamMixin],
  data() {
    return {
      hiddenHeader: false,
    };
  },
  created() {
    if (!this.game) {
      this.newGame();
    }
  },
  methods: {
    emitGlobalEvent(event) {
      EventBus.$emit(event);
    },
  },
  computed: {
    game: () => Game.query().first() || false,
    rounds: () => Round.query().all(),
    currentPage() {
      return this.$route.path;
    },
  },
};
