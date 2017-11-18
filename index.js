
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

            return _.map(subregions, ({ name, location, level, monsters }) => {

                var regionInfo = { name, location, level };

                var sumName = name === regionName ? name : regionName + ' - ' + name;

                return {
                    regionName: sumName  + ' ~ ' + 'Lv. ' + level,
                    monsterInfo: _.sortBy(_.map(monsters, ({ name, level, timePeriod, events, coordinates }) => {
                        return {
                            name: name + ' ~ Lv. ' + level,
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

    var searchNames = loadMonster.substring(1).split('|');

    if(!searchNames || !searchNames.length) return;

    searchNames.forEach(searchName => {
        var realSearchName = searchName
            .split('~')
            .join(' ~ ')
            .split('Lv.')
            .join('Lv. ');

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
            .join('Lv.')
        )
        .join('|');

    window.location.hash = '#' + allMonsters;
}

axios.get('monsters.json')
    .then(res => {
        vue.allMonsters = formatData(res.data);
        loadPreviousMonsters();
    });
