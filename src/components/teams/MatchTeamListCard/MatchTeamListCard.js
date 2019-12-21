export default {
  name: 'TeamListCard',
  props: {
    team: Object,
    matchTeam: Object,
    star: Boolean,
    lastScored: Boolean,
    color: {
      type: String,
      default: 'indigo',
    },
  },
  computed: {
  },
};
