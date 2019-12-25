import RoundMixin from '@mixins/round.mixin';
import Game from '@models/game.model';
import Team from '@models/team.model';
import Round from '@models/round.model';
import EventBus from '@store/event-bus';

export default {
  name: 'DefaultLayout',
  mixins: [RoundMixin],
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
    teamsCount: () => Team.query().count(),
    currentPage() {
      return this.$route.path;
    },
  },
};
