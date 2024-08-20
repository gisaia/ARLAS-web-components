/*
 * Licensed to Gisaïa under one or more contributor
 * license agreements. See the NOTICE.txt file distributed with
 * this work for additional information regarding copyright
 * ownership. Gisaïa licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { Component, OnInit } from '@angular/core';
import { MetricsTable } from "../../../projects/arlas-components/src/lib/components/metrics-table/model/metrics-table";
@Component({
  selector: 'arlas-multi-bar-demo',
  templateUrl: './metrics-table-demo.component.html',
  styleUrls: ['./metrics-table-demo.component.css'],
})
export class MetricsTableDemoComponent implements OnInit {
  public multiBarTableSameTitle: MetricsTable = {
    header: [
      {title: 'produit de la casa par tu', subTitle: ' couverture nuageuse', metric: 'avg'},
      {title: 'produit de la casa par tu', subTitle: ' couverture', metric: 'min'},
      {title: 'produit de la casa par tu', subTitle: ' couverture', metric: 'min'},
      {title: 'produit de la casa par tu', subTitle: ' couverture', metric: 'min'},
    ],
    data: [
      {
        term: 'pneo', data: [
          {value: 800, maxValue: 1000},
          {value: 0, maxValue: 1000},
          {value: 500, maxValue: 1000}, {
            value: 500,
            maxValue: 1000
          }]
      },
      {
        term: 'dede', data: [
          {value: 600, maxValue: 1000},
          {value: 300, maxValue: 1000},
          {value: 500, maxValue: 1000},
          {value: 500, maxValue: 1000
          }
        ]
      },
      {
        term: 'toto', data: [
          {value: 600, maxValue: 1000},
          {value: 500, maxValue: 1000},
          {value: 0, maxValue: 1000}, {value: 500, maxValue: 1000}]
      },
      {
        term: 'titi', data: [
          {value: 600, maxValue: 1000},
          {value: 550, maxValue: 1000},
          {value: 1000, maxValue: 1000},
          {value: 500, maxValue: 1000}]
      },
      {
        term: 'deto', data: [
          {value: 750, maxValue: 1000},
          {value: 40, maxValue: 1000},
          {value: 230, maxValue: 1000},
          {value: 500, maxValue: 1000}
        ]
      },
      {
        term: 'pneo', data: [
          {value: 800, maxValue: 1000},
          {value: 0, maxValue: 1000},
          {value: 500, maxValue: 1000}, {
            value: 500,
            maxValue: 1000
          }]
      },
      {
        term: 'dede', data: [
          {value: 600, maxValue: 1000},
          {value: 300, maxValue: 1000},
          {value: 500, maxValue: 1000},
          {value: 500, maxValue: 1000
          }
        ]
      },
      {
        term: 'toto', data: [
          {value: 600, maxValue: 1000},
          {value: 500, maxValue: 1000},
          {value: 0, maxValue: 1000}, {value: 500, maxValue: 1000}]
      },
      {
        term: 'titi', data: [
          {value: 600, maxValue: 1000},
          {value: 550, maxValue: 1000},
          {value: 1000, maxValue: 1000},
          {value: 500, maxValue: 1000}]
      },
      {
        term: 'deto', data: [
          {value: 750, maxValue: 1000},
          {value: 40, maxValue: 1000},
          {value: 230, maxValue: 1000},
          {value: 500, maxValue: 1000}
        ]
      },
      {
        term: 'pneo', data: [
          {value: 800, maxValue: 1000},
          {value: 0, maxValue: 1000},
          {value: 500, maxValue: 1000}, {
            value: 500,
            maxValue: 1000
          }]
      },
      {
        term: 'dede', data: [
          {value: 600, maxValue: 1000},
          {value: 300, maxValue: 1000},
          {value: 500, maxValue: 1000},
          {value: 500, maxValue: 1000
          }
        ]
      },
      {
        term: 'toto', data: [
          {value: 600, maxValue: 1000},
          {value: 500, maxValue: 1000},
          {value: 0, maxValue: 1000}, {value: 500, maxValue: 1000}]
      },
      {
        term: 'titi', data: [
          {value: 600, maxValue: 1000},
          {value: 550, maxValue: 1000},
          {value: 1000, maxValue: 1000},
          {value: 500, maxValue: 1000}]
      },
      {
        term: 'deto', data: [
          {value: 750, maxValue: 1000},
          {value: 40, maxValue: 1000},
          {value: 230, maxValue: 1000},
          {value: 500, maxValue: 1000}
        ]
      },
      {
        term: 'pneo', data: [
          {value: 800, maxValue: 1000},
          {value: 0, maxValue: 1000},
          {value: 500, maxValue: 1000}, {
            value: 500,
            maxValue: 1000
          }]
      },
      {
        term: 'dede', data: [
          {value: 600, maxValue: 1000},
          {value: 300, maxValue: 1000},
          {value: 500, maxValue: 1000},
          {value: 500, maxValue: 1000
          }
        ]
      },
      {
        term: 'toto', data: [
          {value: 600, maxValue: 1000},
          {value: 500, maxValue: 1000},
          {value: 0, maxValue: 1000}, {value: 500, maxValue: 1000}]
      },
      {
        term: 'titi', data: [
          {value: 600, maxValue: 1000},
          {value: 550, maxValue: 1000},
          {value: 1000, maxValue: 1000},
          {value: 500, maxValue: 1000}]
      },
      {
        term: 'deto', data: [
          {value: 750, maxValue: 1000},
          {value: 40, maxValue: 1000},
          {value: 230, maxValue: 1000},
          {value: 500, maxValue: 1000}
        ]
      },
      {
        term: 'pneo', data: [
          {value: 800, maxValue: 1000},
          {value: 0, maxValue: 1000},
          {value: 500, maxValue: 1000}, {
            value: 500,
            maxValue: 1000
          }]
      },
      {
        term: 'dede', data: [
          {value: 600, maxValue: 1000},
          {value: 300, maxValue: 1000},
          {value: 500, maxValue: 1000},
          {value: 500, maxValue: 1000
          }
        ]
      },
      {
        term: 'toto', data: [
          {value: 600, maxValue: 1000},
          {value: 500, maxValue: 1000},
          {value: 0, maxValue: 1000}, {value: 500, maxValue: 1000}]
      },
      {
        term: 'titi', data: [
          {value: 600, maxValue: 1000},
          {value: 550, maxValue: 1000},
          {value: 1000, maxValue: 1000},
          {value: 500, maxValue: 1000}]
      },
      {
        term: 'deto', data: [
          {value: 750, maxValue: 1000},
          {value: 40, maxValue: 1000},
          {value: 230, maxValue: 1000},
          {value: 500, maxValue: 1000}
        ]
      },
    ]
  };

  public multiBarTDiffTittletesT = {
  "data": [
    {
      "data": [
        {
          "maxValue": 111392232433.07695,
          'value': 80970456.34897614,
          "metric": "sum",
          "column": "demo_ais_flow",
          "field": "course.distance.gps.travelled_m"
        },
        {
          "maxValue": 265079,
          "value": 318,
          "metric": "count",
          "column": "demo_ais_flow"
        },
        {
          "maxValue": 5329,
          "value": 10,
          "metric": "count",
          "column": "demo_ais_course"
        }
      ],
      "term": "Norway"
    },
    {
      "data": [
        {
          "maxValue": 111392232433.07695,
          "value": 1147598646.3789253,
          "metric": "sum",
          "column": "demo_ais_flow",
          "field": "course.distance.gps.travelled_m"
        },
        {
          "maxValue": 265079,
          "value": 1797,
          "metric": "count",
          "column": "demo_ais_flow"
        },
        {
          "maxValue": 5329,
          "value": 14,
          "metric": "count",
          "column": "demo_ais_course"
        }
      ],
      "term": "Poland"
    },
    {
      "data": [
        {
          "maxValue": 111392232433.07695,
          "value": 10926580355.695827,
          "metric": "sum",
          "column": "demo_ais_flow",
          "field": "course.distance.gps.travelled_m"
        },
        {
          "maxValue": 265079,
          "value": 56955,
          "metric": "count",
          "column": "demo_ais_flow"
        },
        {
          "maxValue": 5329,
          "value": 2239,
          "metric": "count",
          "column": "demo_ais_course"
        }
      ],
      "term": "Sweden"
    },
    {
      "data": [
        {
          "maxValue": 111392232433.07695,
          "value": 19779345592.82676,
          "metric": "sum",
          "column": "demo_ais_flow",
          "field": "course.distance.gps.travelled_m"
        },
        {
          "maxValue": 265079,
          "value": 69655,
          "metric": "count",
          "column": "demo_ais_flow"
        },
        {
          "maxValue": 5329,
          "value": 2269,
          "metric": "count",
          "column": "demo_ais_course"
        }
      ],
      "term": "Germany"
    },
    {
      "data": [
        {
          "maxValue": 111392232433.07695,
          "value": 26525471402.52526,
          "metric": "sum",
          "column": "demo_ais_flow",
          "field": "course.distance.gps.travelled_m"
        },
        {
          "maxValue": 265079,
          "value": 150356,
          "metric": "count",
          "column": "demo_ais_flow"
        },
        {
          "maxValue": 5329,
          "value": 5329,
          "metric": "count",
          "column": "demo_ais_course"
        }
      ],
      "term": "Denmark"
    },
    {
      "data": [
        {
          "maxValue": 111392232433.07695,
          "value": 111392232433.07695,
          "metric": "sum",
          "column": "demo_ais_flow",
          "field": "course.distance.gps.travelled_m"
        },
        {
          "maxValue": 265079,
          "value": 265079,
          "metric": "count",
          "column": "demo_ais_flow"
        },
        {
          "maxValue": 5329,
          "value": 4276,
          "metric": "count",
          "column": "demo_ais_course"
        }
      ],
      "term": "Unknown"
    }
  ],
  "header": [
    {
      "title": "demo_ais_flow_demo_ais_flow",
      "subTitle": "course.distance.gps.travelled_m",
      "metric": "sum"
    },
    {
      "title": "demo_ais_flow_demo_ais_flow",
      "metric": "count"
    },
    {
      "title": "demo_ais_course",
      "metric": "count"
    }
  ]
}

  public multiBarTDiffTittle: MetricsTable = {
    header: [
      {title: 'produit produit produit produit produit produit', subTitle: 'couverture nuageuse sssssssssssssssssssssssssssssssssssssssssssssssssssssssss ', metric: 'avg'},
      {title: 'satellite', subTitle: ' couverture nuageuse', metric: 'min'},
      {title: 'produit', subTitle: ' couverture not min', metric: 'min'},
      {title: 'cost', subTitle: ' couverture', metric: 'min'},
    ],
    data: [
      {
        term: 'pneo', data: [
          {value: 800, maxValue: 1000},
          {value: null, maxValue: 0},
          {value: 500, maxValue: 1000}, {
            value: 500,
            maxValue: 1000
          }]
      },
      {
        term: 'dede', data: [
          {value: 600, maxValue: 1000},
          {value: 300, maxValue: 1000},
          {value: 500, maxValue: 1000},
          {value: 500, maxValue: 1000
          }
        ]
      },
      {
        term: 'toto', data: [
          {value: 600, maxValue: 1000},
          {value: 500, maxValue: 1000},
          {value: null, maxValue: 0}, {value: 500, maxValue: 1000}]
      },
      {
        term: 'titi', data: [
          {value: 600, maxValue: 1000},
          {value: 550, maxValue: 1000},
          {value: 1000, maxValue: 1000},
          {value: 500, maxValue: 1000}]
      },
      {
        term: 'deto', data: [
          {value: 750, maxValue: 1000},
          {value: 40, maxValue: 1000},
          {value: 230, maxValue: 1000},
          {value: 500, maxValue: 1000}
        ]
      },
    ]
  };

  public multiBarTAllDiffTittle: MetricsTable = {
    header: [
      {title: 'produit', subTitle: 'couverture nuageuse sssssssssssssssssssssssssssssssssssssssssssssssssssssssss ', metric: 'avg'},
      {title: 'satellite', subTitle: ' couverture nuageuse', metric: 'min'},
      {title: 'course', subTitle: ' couverture not min', metric: 'min'},
      {title: 'cost', subTitle: ' couverture', metric: 'min'},
    ],
    data: [
      {
        term: 'pneo', data: [
          {value: 800, maxValue: 1000},
          {value: null, maxValue: 0},
          {value: 500, maxValue: 1000}, {
            value: 500,
            maxValue: 1000
          }]
      },
      {
        term: 'dede', data: [
          {value: 600, maxValue: 1000},
          {value: 300, maxValue: 1000},
          {value: 500, maxValue: 1000},
          {value: 500, maxValue: 1000
          }
        ]
      },
      {
        term: 'toto', data: [
          {value: 600, maxValue: 1000},
          {value: 500, maxValue: 1000},
          {value: null, maxValue: 0}, {value: 500, maxValue: 1000}]
      },
      {
        term: 'titi', data: [
          {value: 600, maxValue: 1000},
          {value: 550, maxValue: 1000},
          {value: 1000, maxValue: 1000},
          {value: 500, maxValue: 1000}]
      },
      {
        term: 'deto', data: [
          {value: 750, maxValue: 1000},
          {value: 40, maxValue: 1000},
          {value: 230, maxValue: 1000},
          {value: 500, maxValue: 1000}
        ]
      },
    ]
  };
  constructor() { }

  ngOnInit(): void {
  }

}
