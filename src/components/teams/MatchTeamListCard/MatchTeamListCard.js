export default {
  name: 'TeamListCard',
  props: {
    match: Object,
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
