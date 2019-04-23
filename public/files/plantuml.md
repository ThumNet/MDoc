# PlantUML demo

See [http://plantuml.com](http://plantuml.com)

## Simple sample

```plantuml
Bob->Alice : hello
```

Use code:
````
```plantuml
Bob->Alice : hello
```
````


## Use case

```plantuml
User -> (Start)
User --> (Use the application) : A small label

:Main Admin: ---> (Use the application) : This is\nyet another\nlabel
```

Use code:
````
```plantuml
User -> (Start)
User --> (Use the application) : A small label

:Main Admin: ---> (Use the application) : This is\nyet another\nlabel
```
````