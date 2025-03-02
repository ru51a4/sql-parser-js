import SimpleSqlParserJs from "./index.js"

class mysql {
    static table = {
        "POSTS": {
            col: ['ID', 'MSG', 'USER_ID', 'DIARY_ID'],
            data: [
                [1, "hello world", 1, 1],
                [2, "hello world1", 1, 1],
                [3, "hello world2", 1, 1],
                [4, "hello world3", 1, 1],
                [50, "hello world4", 1, 1],

            ],
        },
        "USERS": {
            col: ["ID", "LOGIN", "STATUS"],
            data: [
                [1, "admin", 2],
                [1, "user", 1],
            ]
        }
    };
    static query(str) {
        let operation = [];
        operation["<"] = (a, b) => {
            return a < b;
        }
        operation[">"] = (a, b) => {
            return a > b;
        }
        operation["="] = (a, b) => {
            return a == b;
        }
        operation["<>"] = (a, b) => {
            return a != b;
        }
        let _query = SimpleSqlParserJs.build(str)[0];
        let res = [];
        let aliasTable = [];
        aliasTable[_query.fromSources[0].alias] = _query.fromSources[0].table;

        for (let i = 0; i <= mysql.table[_query.fromSources[0].table].data.length - 1; i++) {
            let f = true;
            let row = mysql.getObj(_query.fromSources[0].table, i, _query.fromSources[0].alias);
            //join
            for (let j = 0; j <= _query.joins.length - 1; j++) {
                let jf = true;
                let jt = _query.joins[j].table
                let ja = _query.joins[j].alias;

                aliasTable[ja] = jt;
                for (let jj = 0; jj <= mysql.table[jt].data.length - 1; jj++) {
                    //todo
                    let currJoinRow = mysql.getObj(jt, j, ja);
                    mysql.megeObj(row, currJoinRow);
                    break;
                }
            }
            //
            for (let j = 0; j <= _query.whereClauses.length - 1; j++) {
                let left = _query.whereClauses[j].left.split(".");
                let numLeft = mysql.table[aliasTable[_query.fromSources[0].alias]].col.indexOf(left[1])

                left = mysql.table[aliasTable[_query.fromSources[0].alias]].data[i][numLeft];

                let right = _query.whereClauses[j].right;

                if (!operation[_query.whereClauses[j].type](left, right)) {
                    f = false;
                    break;
                }
            }
            if (f) {
                res.push(row)
            }
        }
        return (res)
    }

    static megeObj(obj, obj2) {

        Object.keys(obj2).forEach((key) => {
            obj[key] = obj2[key];
        })
    }

    static getObj(table, j, alias) {
        let obj = {};
        let r = mysql.table[table];
        for (let i = 0; i <= r.col.length - 1; i++) {
            obj[alias ? alias + '.' + r.col[i] : "" + r.col[i]] = r.data[j][i];
        }
        return obj;
    }
}
console.log(mysql.query('SELECT * FROM posts p JOIN users u ON p.user_id = u.id where p.id = 2'))