export default {
  name: 'TeamListCard',
  props: {
    team: Object,
    alterable: Boolean,
    color: {
      type: String,
      default: 'indigo-5',
    },
  },
  data() {
    return {
      isPlayersVisibles: false,
    };
  },
};
