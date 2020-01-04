import _ from 'lodash';
import Game from '@models/game.model';
import Player from '@models/player.model';
import Team from '@models/team.model';
import Avatars from '@json/avatars.json';

export default {
  name: 'TeamFormCard',
  props: {
    team: Object,
    minPlayers: Number,
    maxPlayers: Number,
  },
  data() {
    return {
      avatarsPerTab: 8,
      avatarTab: 0,
    };
  },
  methods: {
    addPlayer(playerIndex) {
      // Tant que le nombre max de joueurs n'est pas atteint
      if (this.team.players.length < Number(this.game.maxTeamSize)) {
        this.team.players.push({
          name: '',
        });
        // Focus sur le nouveau champs joueur
        this.$nextTick(() => {
          this.$refs[`playerName${playerIndex}`][0].$el.focus();
        });
      } else {
        this.$emit('save', this.team);
      }
    },
    removePlayer(index) {
      if (this.team.players[index].id) {
        Player.delete(this.team.players[index].id);
      }
      this.team.players.splice(index, 1);
    },
    selectAvatar(avatar) {
      this.team.avatar = avatar;
      this.$nextTick(() => {
        this.$refs['team-name'].$el.focus();
      });
    },
    isAvatarFree(avatar) {
      const teamAvatars = this.teams.map(team => team.avatar);

      return _.indexOf(teamAvatars, avatar) !== -1;
    },
  },
  computed: {
    game: () => Game.query().first(),
    teams: () => Team.query().all(),
    avatars: () => Avatars,
    avatarsChunk() {
      return _.chunk(this.avatars, this.avatarsPerTab);
    },
  },
};
