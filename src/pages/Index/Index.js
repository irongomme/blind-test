import Game from '@models/game.model';

export default {
  name: 'PageIndex',
  data() {
    return {
      gameForm: new Game(),
      confirmGameDialog: false,
    };
  },
  methods: {
    confirmNewGame() {
      if (!this.game) {
        this.createNewGame();
      } else {
        this.confirmGameDialog = true;
      }
    },
    createNewGame() {
      // On efface tout on recommence
      this.$store.dispatch('entities/deleteAll');
      // Enregistrement de la nouvelle partie
      Game.insert({ data: this.gameForm });
      // Redirection vers la gestion des équipes
      this.$router.push('/equipes');
    },
  },
  computed: {
    game: () => Game.query().first() || false,
  },
};
