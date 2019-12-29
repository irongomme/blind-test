import Team from '@models/team.model';

export default {
  data() {
    return {
    };
  },
  computed: {
    teamsCount: () => Team.query().count(),
  },
};
