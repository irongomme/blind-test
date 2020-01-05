import RoundMixin from '@mixins/round.mixin';
import TeamMixin from '@mixins/team.mixin';
import Game from '@models/game.model';
import Round from '@models/round.model';
import EventBus from '@store/event-bus';
import { global } from '@utils/global.js';

export default {
  name: 'DefaultLayout',
  mixins: [RoundMixin, TeamMixin],
  data() {
    return {
      headerVisibility: true,
      global,
    };
  },
  methods: {
    emitGlobalEvent(event) {
      EventBus.$emit(event);
    },
    toggleMaximize() {
      this.headerVisibility = !this.headerVisibility;
      this.$q.fullscreen.toggle();
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
