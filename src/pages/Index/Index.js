import Game from '@models/game.model';

export default {
  name: 'PageIndex',
  data() {
    return {
      gameForm: new Game(),
    };
  },
  methods: {
    newGame() {
      // On efface tout on recommence
      this.$store.dispatch('entities/deleteAll');

      // Enregistrement de la nouvelle partie
      Game.insert({
        data: this.gameForm,
      });

      // Redirection vers la gestion des équipes
      this.$router.push('/equipes');
    },
  },
  computed: {
    game: () => Game.query().first() || false,
  },
};
