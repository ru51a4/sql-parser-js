class Query {
    columns = [];
    fromSources = [];
    joins = [];
    whereClauses = [];
    groupByColumns = [];
    sortColumns = [];
    //limit;
    static build = (input) => {
        input = input.split("\n").join(" ").trim().split(" ").map((s) => s.toUpperCase().split(",").join(""));

        let lex = (str) => {
            let query = new Query();
            let isColumns = false;
            let isFromSources = false;
            let isJoin = false;
            let isWhere = false;
            let isGroup = false;
            let isOrder = false;
            while (str.length) {
                let token = str.shift();
                if (token === 'SELECT') {
                    isColumns = true;
                    continue
                }
                if (token === 'FROM') {
                    isColumns = false;
                    isFromSources = true;
                    continue
                }
                if (token === 'JOIN') {
                    isFromSources = false;
                    isJoin = true;
                    continue
                }
                if (token === 'WHERE') {
                    isFromSources = false;
                    isJoin = false;
                    isWhere = true;
                    continue
                }
                if (token === 'GROUP') {
                    isFromSources = false;
                    isJoin = false;
                    isWhere = false;
                    isGroup = true;
                    str.shift();
                    continue
                }
                if (token === 'ORDER') {
                    isFromSources = false;
                    isJoin = false;
                    isWhere = false;
                    isGroup = false;
                    isOrder = true;
                    str.shift();
                    continue
                }
                if (isColumns) {
                    query.columns.push(token)
                    continue;
                }
                if (isFromSources) {
                    query.fromSources.push(token)
                    continue;
                }
                if (isJoin) {
                    query.joins.push(token)
                    continue;
                }

                if (isWhere) {
                    query.whereClauses.push(token)
                    continue;
                }
                if (isGroup) {
                    query.groupByColumns.push(token)
                }
                if (isOrder) {
                    query.sortColumns.push(token)
                }

            }
            let t = [];
            if (!query.fromSources.length) {
                throw 'Error in from';
            }
            for (let i = 0; i <= query.fromSources.length - 1; i = i + 2) {
                if (!query.fromSources[i] || !query.fromSources[i + 1]) {
                    throw 'Error in from';
                }
                t.push({ "table": query.fromSources[i], 'alias': query.fromSources[i + 1] })
            }
            query.fromSources = t;

            t = [];
            if (!query.columns.length) {
                throw 'Error in from';
            }
            for (let i = 0; i <= query.columns.length - 1; i++) {
                if (!query.columns[i]) {
                    throw 'Error in columns';
                }
                if (query.columns[i + 1] === 'AS') {
                    if (!query.columns[i] || !query.columns[i + 2]) {
                        throw 'Error in columns';
                    }
                    t.push({ "col": query.columns[i], 'alias': query.columns[i + 2] })
                    i++
                    i++;
                } else {
                    t.push({ "col": query.columns[i] })
                }
            }
            query.columns = t;
            t = [];
            for (let i = 0; i <= query.joins.length - 1; i = i + 2) {
                t.push({ "table": query.joins[i], 'alias': query.joins[i + 1] })
                if (!query.joins[i] || !query.joins[i + 1]) {
                    throw 'Error in join';
                }
                if (query.joins[i + 2] === 'ON' || query.joins[i + 2] === 'AND' || query.joins[i + 2] === 'OR') {
                    if (!query.joins[i + 3] || !query.joins[i + 5] || !query.joins[i + 4] || !query.joins[i + 2]) {
                        throw 'Error in join';
                    }
                    t[t.length - 1].exp = [];
                    t[t.length - 1].exp.push({ 'left': query.joins[i + 3], 'right': query.joins[i + 5], 'type': query.joins[i + 4], 'ttype': query.joins[i + 2] })
                    i++;
                    i++;
                    i++;
                    i++;
                }
            }
            query.joins = t;

            t = [];
            for (let i = 0; i <= query.whereClauses.length - 1; i = i + 3) {
                let next = (query.whereClauses[i + 3]);
                if (next) {
                    if (!query.whereClauses[i + 3] || !query.whereClauses[i] || !query.whereClauses[i + 2] || !query.whereClauses[i + 1]) {
                        throw 'Error in where';
                    }
                    t.push({ "next": next, "left": query.whereClauses[i], 'right': query.whereClauses[i + 2], 'type': query.whereClauses[i + 1] })
                    i++
                }
                else {
                    if (!query.whereClauses[i] || !query.whereClauses[i + 2] || !query.whereClauses[i + 1]) {
                        throw 'Error in where';
                    }
                    t.push({ "left": query.whereClauses[i], 'right': query.whereClauses[i + 2], 'type': query.whereClauses[i + 1] })
                }
            }
            query.whereClauses = t;
            t = [];
            for (let i = 0; i <= query.groupByColumns.length - 1; i++) {
                t.push({ "col": query.groupByColumns[i] })
            }
            query.groupByColumns = t;
            t = [];
            for (let i = 0; i <= query.sortColumns.length - 1; i = i + 2) {
                if (!query.sortColumns[i]) {
                    throw 'Error in ORDER';
                }
                t.push({ "col": query.sortColumns[i], 'type': query.sortColumns[i + 1] })
                i++
            }
            query.sortColumns = t;

            return query;
        };


        let t = [[]];
        let nested = (str) => {
            let tt = [];
            while (str.length) {
                let token = str.shift();
                if (token === '(') {
                    t[t.length - 1].push(...tt);
                    tt = [];
                    t.push([])
                }
                else if (token === ')') {
                    t[t.length - 1].push(...tt);
                    tt = [];
                    //
                    let c = t[t.length - 1];
                    t.pop();
                    t[t.length - 1].push(c);
                } else {
                    tt.push(token)
                }
            }

        };
        nested(input);

        let calc = (c) => {
            c.splice(0, c.length - 1, lex(c))
        }
        let deep = (arr, init = true) => {
            for (let i = 0; i <= arr.length - 1; i++) {
                if (Array.isArray(arr[i])) {
                    if (arr[i].length === 1) {
                        arr[i] = arr[i][0];
                    } else {
                        deep(arr[i], 0);
                        i = i - 1;
                    }
                }
            }
            if (!init) {
                calc(arr)
            }
        }
        deep(t[0]);
        t = t[0]
        return t
    }
}
function getObject(input) {
    let q = new Query();
    return (Query.build(input))
}
