
Vue.component('multiselect', VueMultiselect.default);

var vue = new Vue({
    el: '#app',
    data: {
        search: 'goblin',
        currentMonsters: [],
        allMonsters: [],
        noExtraData: true
    },
    methods: {
        updateHash() {
            updateWindowHash();
        }
    }
});

function formatData(data) {
    return _(data.regions)
        .map(({ name, subregions }) => {
            var regionName = name;

            return _.map(subregions, ({ name, location, level, abbrev, monsters }) => {

                var regionInfo = { name, location, level, abbrev };

                var sumName = name === regionName ? name : regionName + ' - ' + name;

                return {
                    regionName: sumName  + ' ~ ' + 'Lv. ' + level,
                    monsterInfo: _.sortBy(_.map(monsters, ({ name, level, timePeriod, events, coordinates }) => {
                        return {
                            name: name + ' ~ Lv. ' + level + ' (' + abbrev + ')',
                            data: {
                                name, level, timePeriod, events, coordinates
                            },
                            regionData: regionInfo
                        };
                    }), 'data.level')
                };

            });
        })
        .flattenDeep()
        .value();
}

function loadPreviousMonsters() {
    var loadMonster = window.location.hash;
    if(!loadMonster) return;

    var searchNames = decodeURIComponent(loadMonster.substring(1)).split('|');

    if(!searchNames || !searchNames.length) return;

    searchNames.forEach(searchName => {
        var realSearchName = searchName
            .split('~')
            .join(' ~ ')
            .split('Lv')
            .join('Lv. ')
            .split('(')
            .join(' (');

        var monsterObj = _(vue.allMonsters)
            .map('monsterInfo')
            .flattenDeep()
            .filter({ name: realSearchName })
            .value()[0];

        if(!monsterObj) return;

        vue.currentMonsters.push(monsterObj);
    });

}

function updateWindowHash() {
    var allMonsters = vue.currentMonsters
        .map(x => x.name
            .split(' ~ ')
            .join('~')
            .split('Lv. ')
            .join('Lv')
            .split(' (')
            .join('(')
        )
        .join('|');

    window.location.hash = '#' + encodeURIComponent(allMonsters);
}

axios.get('monsters.yml')
    .then(res => {
        vue.allMonsters = formatData(YAML.parse(res.data));
        loadPreviousMonsters();
    });
