provider "aws" {
  version = "~> 2.0"
  region  = "eu-west-2" # Setting my region to London. Use your own region here
#  access_key = ""
#  secret_key = ""
}


variable "mongo_user"  {
  description = "mongodb user name"
  type = string
  default = ""
}

variable "mongo_pass"  {
  description = "mongodb password"
  type = string
  default = ""
}

variable "mongo_url"  {
  description = "mongodb url"
  type = string
  default = ""
}



# No longer need this, using dockerhub repo
#
#resource "aws_ecr_repository" "my_first_ecr_repo" {
#  name = "my-first-ecr-repo" # Naming my repository
#}


#resource "aws_ecs_cluster" "mongo_wrapper_cluster" {
#  name = "mongo-wrapper-cluster" # Naming the cluster
#}

#      "image": "${aws_ecr_repository.my_first_ecr_repo.repository_url}",
resource "aws_ecs_task_definition" "mongo_wrapper_task" {
  family                   = "mongo-wrapper-task" # Naming our first task
  container_definitions    = <<DEFINITION
  [
    {
      "name": "mongo-wrapper-task",
      "image": "mcguinnessa/md-mongo-wrapper",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3000,
          "hostPort": 3000
        }
      ],
      "memory": 512,
      "cpu": 256,
      "environment": [
      {
        "name": "MONGODB_USER",
        "value": "${var.mongo_user}"
      },
      {
        "name": "MONGODB_PASSWORD",
        "value": "${var.mongo_pass}"
      },
      {
        "name": "MONGODB_URI",
        "value": "${var.mongo_url}"
      },
      {
        "name": "SERVER_PORT",
        "value": "3000"
      }],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "monitor-logging-container",
          "awslogs-region": "eu-west-2",
          "awslogs-create-group": "true",
          "awslogs-stream-prefix": "mdwrap"
        }
      }
    }
  ]
  DEFINITION
  requires_compatibilities = ["FARGATE"] # Stating that we are using ECS Fargate
  network_mode             = "awsvpc"    # Using awsvpc as our network mode as this is required for Fargate
  memory                   = 512         # Specifying the memory our container requires
  cpu                      = 256         # Specifying the CPU our container requires
#  execution_role_arn       = "${aws_iam_role.ecsTaskExecutionRole2.arn}"
#  execution_role_arn       = "arn:aws:iam::182028175464:role/ecsTaskExecutionRole2"
  execution_role_arn       = "arn:aws:iam::182028175464:role/AlexECSTaskExecutionRole"
}

#resource "aws_iam_role" "ecsTaskExecutionRole2" {
#  name               = "ecsTaskExecutionRole2"
#  assume_role_policy = "${data.aws_iam_policy_document.assume_role_policy.json}"
#}
#
#data "aws_iam_policy_document" "assume_role_policy" {
#  statement {
#    actions = ["sts:AssumeRole"]
#
#    principals {
#      type        = "Service"
#      identifiers = ["ecs-tasks.amazonaws.com"]
#    }
#  }
#}
#
#resource "aws_iam_role_policy_attachment" "ecsTaskExecutionRole2_policy" {
#  role       = "${aws_iam_role.ecsTaskExecutionRole2.name}"
#  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
#}

resource "aws_ecs_service" "mongo_wrapper_service" {
  name            = "mongo-wrapper-service"                             # Naming our first service
#  cluster         = "${aws_ecs_cluster.mongo_wrapper_cluster.id}"             # Referencing our created Cluster
  cluster         = "monitor-cluster"             # Referencing our created Cluster
  task_definition = "${aws_ecs_task_definition.mongo_wrapper_task.arn}" # Referencing the task our service will spin up
  launch_type     = "FARGATE"
  desired_count   = 1 # Setting the number of containers we want deployed to 3

  load_balancer {
    target_group_arn = "${aws_lb_target_group.mongo_wrapper_target_group.arn}" # Referencing our target group
    container_name   = "${aws_ecs_task_definition.mongo_wrapper_task.family}"
    container_port   = 3000 # Specifying the container port
  }

  depends_on = [aws_lb_listener.listener]

  network_configuration {
    subnets          = ["${aws_default_subnet.default_subnet_a.id}", "${aws_default_subnet.default_subnet_b.id}", "${aws_default_subnet.default_subnet_c.id}"]
    assign_public_ip = true                                                # Providing our containers with public IPs
    security_groups  = ["${aws_security_group.mongo_wrapper_service_security_group.id}"] # Setting the security group
  }
}

resource "aws_security_group" "mongo_wrapper_service_security_group" {
  ingress {
    from_port = 0
    to_port   = 0
    protocol  = "-1"
    # Only allowing traffic in from the load balancer security group
    security_groups = ["${aws_security_group.load_balancer_security_group.id}"]
  }

  egress {
    from_port   = 0 # Allowing any incoming port
    to_port     = 0 # Allowing any outgoing port
    protocol    = "-1" # Allowing any outgoing protocol
    cidr_blocks = ["0.0.0.0/0"] # Allowing traffic out to all IP addresses
  }
}

# Providing a reference to our default VPC
resource "aws_default_vpc" "default_vpc" {
}

# Providing a reference to our default subnets
resource "aws_default_subnet" "default_subnet_a" {
  availability_zone = "eu-west-2a"
}

resource "aws_default_subnet" "default_subnet_b" {
  availability_zone = "eu-west-2b"
}

resource "aws_default_subnet" "default_subnet_c" {
  availability_zone = "eu-west-2c"
}


#
# The Load balancer
#
resource "aws_alb" "mongo_wrapper_load_balancer" {
  name               = "mongo-wrapper-lb-tf" # Naming our load balancer
  load_balancer_type = "application"
  subnets = [ # Referencing the default subnets
    "${aws_default_subnet.default_subnet_a.id}",
    "${aws_default_subnet.default_subnet_b.id}",
    "${aws_default_subnet.default_subnet_c.id}"
  ]
  # Referencing the security group
  security_groups = ["${aws_security_group.load_balancer_security_group.id}"]
}

# Creating a security group for the load balancer:
resource "aws_security_group" "load_balancer_security_group" {
  ingress {
    from_port   = 3000 # Allowing traffic in from port 80
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Allowing traffic in from all sources
  }

  egress {
    from_port   = 0 # Allowing any incoming port
    to_port     = 0 # Allowing any outgoing port
    protocol    = "-1" # Allowing any outgoing protocol 
    cidr_blocks = ["0.0.0.0/0"] # Allowing traffic out to all IP addresses
  }
}

resource "aws_lb_target_group" "mongo_wrapper_target_group" {
  name        = "target-group"
  port        = 3000
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = "${aws_default_vpc.default_vpc.id}" # Referencing the default VPC
  health_check {
    matcher = "200,301,302"
    path = "/motraffic"
  }
}

resource "aws_lb_listener" "listener" {
  load_balancer_arn = "${aws_alb.mongo_wrapper_load_balancer.arn}" # Referencing our load balancer
  port              = "3000"
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = "${aws_lb_target_group.mongo_wrapper_target_group.arn}" # Referencing our target group
  }
}




