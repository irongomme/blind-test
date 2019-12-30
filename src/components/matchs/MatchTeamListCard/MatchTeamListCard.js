import Game from '@models/game.model';

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
  data() {
    return {
      finalFrenchPosition: ['1er', '2ème', '3ème', '4ème', '5ème', '6ème'],
    };
  },
  computed: {
    game: () => Game.query().first() || false,
    isFinalWon() {
      return this.match.team.rank > 0;
    },
    isMatchClosed() {
      return this.match.match.is_closed || this.isFinalWon;
    },
  },
};
