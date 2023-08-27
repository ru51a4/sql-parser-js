class Query {
    columns = [];
    fromSources = [];
    joins = [];
    whereClauses = [];
    groupByColumns = [];
    sortColumns = [];
    limit;
}

let input = `SELECT * FROM diaries a JOIN ( SELECT diary_id, MAX(id) FROM posts p group by diary_id ) gg ON a.id = gg.di`;

input = input.split(" ").map((s) => s.toUpperCase());
let lex = (str) => {
    let query = new Query();
    let isColumns = false;
    let isFromSources = false;
    let join = false;
    let group = false;
    while (str.length) {
        let token = str.shift();
        if (token == "(") {
            let _ = [];
            let _t = str.shift();
            while (_t !== ")") {
                _.push(_t);
                _t = str.shift();
            }
            token = lex(_);
        }



        if (token == "SELECT") {
            isColumns = true;
            continue;
        }
        if (isColumns) {
            if (token == "FROM") {
                isFromSources = true;
                isColumns = false;
                continue;
            }
            query.columns.push(token);
            continue
        }
        if (isFromSources) {
            if (token == "JOIN") {
                join = true;
                isFromSources = false;
                continue;
            }
            if (str[0] !== "JOIN") {
                let _ = str.shift();
                query.fromSources.push({ "table": token, "name": _ });
                if (str[0] !== "JOIN") {
                    isFromSources = false;
                }
                continue
            }
        }
        if (join) {
            console.log({ token })
            if (token == "ON") {
                let left = str.shift();
                let exp = str.shift();
                let right = str.shift();
                query.joins[query.joins.length - 1].on = [left, exp, right];
                join = false;
                continue;
            }
            let _ = str.shift();
            query.joins.push({ "table": token, "name": _ })
            continue
        }
        if (token == "GROUP") {
            query.groupByColumns = [];
            group = true;
            str.shift();
            continue
        }
        if (group) {
            query.groupByColumns.push(token);
            group = false;
            continue;
        }

    }
    return query;
};

console.log(lex(input));
