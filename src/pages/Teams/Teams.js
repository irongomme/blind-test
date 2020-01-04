import TeamMixin from '@mixins/team.mixin';
import RoundMixin from '@mixins/round.mixin';
import TeamListCard from '@components/teams/TeamListCard';
import TeamFormCard from '@components/teams/TeamFormCard';
import Game from '@models/game.model';
import Team from '@models/team.model';
import FakeTeams from '@json/fake_teams.json';
import EventBus from '@store/event-bus';

export default {
  name: 'PageTeams',
  components: { TeamListCard, TeamFormCard },
  mixins: [TeamMixin, RoundMixin],
  data() {
    return {
      teamObject: {},
      deleteTeamConfirm: false,
      deleteTeamItem: {},
      teamFormPopup: false,
    };
  },
  created() {
    this.resetTeam();
  },
  mounted() {
    EventBus.$on('addTeam', () => {
      this.teamFormPopup = true;
    });
  },
  methods: {
    emitGlobalEvent(event) {
      EventBus.$emit(event);
    },
    generateFakeTeams() {
      // Reset des équipes
      Team.deleteAll();
      // Création du nombre d'équipes nécessaires
      Team.insert({
        data: FakeTeams.slice(0, Number(this.game.numberOfTeams)),
      });
    },
    resetTeam() {
      this.teamFormPopup = false;
      this.teamObject = {
        avatar: '',
        players: [],
      };
    },
    editTeam(team) {
      this.teamObject = Team.query()
        .with('players')
        .whereId(team.id)
        .first();
      this.teamFormPopup = true;
    },
    saveTeam(team) {
      Team.insert({
        data: team,
      }).then(() => {
        this.$q.notify({ message: 'Équipe enregistrée !' });
      });

      this.resetTeam();
    },
    confirmTeamDelete(team) {
      this.deleteTeamConfirm = true;
      this.deleteTeamItem = team;
    },
    deleteTeam(team) {
      Team.delete(team.id).then(() => {
        this.$q.notify({ message: 'Équipe supprimée !' });
      });
      this.resetTeam();
    },
  },
  computed: {
    game: () => Game.query().first() || false,
    teams: () => Team.query().with('players').all() || [],
  },
};
